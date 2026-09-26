import { AnthropicBedrockMantle } from "npm:@anthropic-ai/bedrock-sdk";
import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  loadPlanContext,
  type PlanContext,
  READ_ONLY_TOOLS,
  runReadOnlyTool,
  TOOL_NAMES,
  TOOLS,
  validateProposal,
} from "./tools.ts";

// Proveedor segun los secrets: con ANTHROPIC_API_KEY se usa la API de Claude directa;
// si no, AWS Bedrock (AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY se leen solas).
// Las dos exponen la misma API de messages, el resto de la funcion no cambia.
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const client = ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: ANTHROPIC_API_KEY })
  : new AnthropicBedrockMantle({ awsRegion: Deno.env.get("AWS_REGION")! });
const MODEL = ANTHROPIC_API_KEY ? (Deno.env.get("ANTHROPIC_MODEL") ?? "claude-opus-5") : Deno.env.get("BEDROCK_MODEL_ID")!;
const RATE_LIMIT_PER_MINUTE = 10;
const MAX_TOOL_ROUNDS = 4;
const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 2000;
const GENERIC_ERROR = "No pude procesar eso, ¿puedes reformular?";

const BASE_SYSTEM = `Eres el asistente de Zumek, una app que arma el menú semanal dentro de un presupuesto.
Responde en español de México, en 1 a 3 oraciones.
Nunca calcules precios, cantidades ni totales: esos números los calcula el planner de la app y se los muestra al usuario junto a tu propuesta.
Para cambiar el plan usa update_budget, swap_recipe o swap_ingredient con ids del contexto; el usuario confirmará antes de aplicar. Propón un solo cambio a la vez.
Si lo que piden no se puede hacer con tus herramientas, dilo en lugar de inventar.`;

const COOKING_SYSTEM = `El usuario está cocinando ahora mismo. Responde dudas sobre el paso actual con get_recipe_step: lee el paso real antes de explicarlo y no inventes pasos, cantidades ni tiempos que no estén en la receta.`;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

/**
 * El historial llega del cliente: solo se aceptan turnos de texto, alternados y
 * terminando en el usuario. Nunca bloques tool_use/tool_result armados por el cliente.
 */
function parseMessages(raw: unknown): Anthropic.MessageParam[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_MESSAGES) return null;
  const messages: Anthropic.MessageParam[] = [];
  for (const m of raw) {
    const { role, content } = (m ?? {}) as { role?: unknown; content?: unknown };
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    const text = content.trim().slice(0, MAX_MESSAGE_CHARS);
    if (!text) return null;
    const last = messages.at(-1);
    // Dos turnos seguidos del mismo rol (p. ej. un error que no llego) se unen en uno.
    if (last?.role === role) last.content = `${last.content}\n${text}`;
    else messages.push({ role, content: text });
  }
  return messages[0]?.role === "user" && messages.at(-1)?.role === "user" ? messages : null;
}

function parseCooking(raw: unknown): { recipe_id: string; step_index: number } | null {
  const { recipe_id, step_index } = (raw ?? {}) as { recipe_id?: unknown; step_index?: unknown };
  return typeof recipe_id === "string" && Number.isInteger(step_index) && (step_index as number) >= 0
    ? { recipe_id, step_index: step_index as number }
    : null;
}

function systemPrompt(ctx: PlanContext, cooking: { recipe_id: string; step_index: number } | null): string {
  const parts = [BASE_SYSTEM, `Contexto del plan actual (JSON):\n${JSON.stringify(ctx)}`];
  if (cooking) parts.push(COOKING_SYSTEM, `Receta en curso: ${cooking.recipe_id}, paso actual (step_index): ${cooking.step_index}.`);
  return parts.join("\n\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  // Cliente con el JWT del usuario: todas las consultas pasan por RLS.
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, 401);

  let body: { messages?: unknown; plan_id?: unknown; cooking?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  const messages = parseMessages(body.messages);
  if (!messages || typeof body.plan_id !== "string") return json({ error: "bad_request" }, 400);
  const cooking = body.cooking === undefined ? null : parseCooking(body.cooking);
  if (body.cooking !== undefined && !cooking) return json({ error: "bad_request" }, 400);

  // Límite de uso: filtro explícito por usuario además de RLS.
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabase
    .from("ai_call_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);
  if ((count ?? 0) >= RATE_LIMIT_PER_MINUTE) return json({ error: "rate_limited" }, 429);
  await supabase.from("ai_call_log").insert({ user_id: user.id });

  // El plan sale de la base con RLS: un plan_id ajeno simplemente no se encuentra.
  const ctx = await loadPlanContext(supabase, body.plan_id);
  if (!ctx) return json({ error: "plan_not_found" }, 404);

  try {
    const history: Anthropic.MessageParam[] = [...messages];
    const system = systemPrompt(ctx, cooking);
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 2048,
        system,
        tools: TOOLS,
        messages: history,
      });

      if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") return json({ text: GENERIC_ERROR });

      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );

      if (toolUses.length === 0) return json({ text: text || GENERIC_ERROR });
      if (toolUses.some((t) => !TOOL_NAMES.has(t.name))) return json({ text: GENERIC_ERROR });

      // Tool que modifica el plan: se valida contra el plan real y se propone, no se ejecuta.
      const change = toolUses.find((t) => !READ_ONLY_TOOLS.has(t.name));
      if (change) {
        const input = validateProposal(change.name, change.input, ctx);
        if (!input) return json({ text: GENERIC_ERROR });
        return json({ text, proposal: { tool: change.name, input } });
      }

      // Tools de solo lectura: se ejecutan y el resultado vuelve a Claude.
      history.push({ role: "assistant", content: response.content });
      const results: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolUses.map(async (t) => ({
          type: "tool_result" as const,
          tool_use_id: t.id,
          content: JSON.stringify(await runReadOnlyTool(supabase, t.name, t.input, ctx)),
        })),
      );
      history.push({ role: "user", content: results });
    }
    return json({ text: GENERIC_ERROR });
  } catch (error) {
    console.error(error); // se ve en los logs de Supabase, nunca en la app
    return json({ text: GENERIC_ERROR });
  }
});
