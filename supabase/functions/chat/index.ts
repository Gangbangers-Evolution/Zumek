import { AnthropicBedrockMantle } from "npm:@anthropic-ai/bedrock-sdk";
import type Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js@2";
import { READ_ONLY_TOOLS, runReadOnlyTool, TOOL_NAMES, TOOLS } from "./tools.ts";

// AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY se leen solas de los secrets.
const client = new AnthropicBedrockMantle({ awsRegion: Deno.env.get("AWS_REGION")! });
const MODEL = Deno.env.get("BEDROCK_MODEL_ID")!;
const RATE_LIMIT_PER_MINUTE = 10;
const MAX_TOOL_ROUNDS = 4;
const GENERIC_ERROR = "No pude procesar eso, ¿puedes reformular?";

const SYSTEM = `Eres el asistente de Zumek, una app que arma el menú semanal dentro de un presupuesto.
Responde en español de México, en 1 a 3 oraciones.
Nunca calcules precios, cantidades ni totales: esos números los calcula el planner.
Para cambiar el plan usa update_budget, swap_recipe o swap_ingredient; el usuario confirmará antes de aplicar.
Si lo que piden no se puede hacer con tus herramientas, dilo en lugar de inventar.`;

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  // Cliente con el JWT del usuario: todas las consultas pasan por RLS.
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, 401);

  let body: { messages?: Anthropic.MessageParam[]; plan_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  const { messages, plan_id } = body;
  if (!Array.isArray(messages) || messages.length === 0 || typeof plan_id !== "string") {
    return json({ error: "bad_request" }, 400);
  }

  // Límite de uso: filtro explícito por usuario además de RLS.
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabase
    .from("ai_call_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);
  if ((count ?? 0) >= RATE_LIMIT_PER_MINUTE) return json({ error: "rate_limited" }, 429);
  await supabase.from("ai_call_log").insert({ user_id: user.id });

  try {
    const history: Anthropic.MessageParam[] = [...messages];
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 16000,
        system: SYSTEM,
        tools: TOOLS,
        messages: history,
      });

      if (response.stop_reason === "refusal") return json({ text: GENERIC_ERROR });

      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );

      if (toolUses.length === 0) return json({ text });
      if (toolUses.some((t) => !TOOL_NAMES.has(t.name))) return json({ text: GENERIC_ERROR });

      // Tool que modifica el plan: se propone, no se ejecuta.
      const change = toolUses.find((t) => !READ_ONLY_TOOLS.has(t.name));
      if (change) return json({ text, proposal: { tool: change.name, input: change.input } });

      // Tools de solo lectura: se ejecutan y el resultado vuelve a Claude.
      history.push({ role: "assistant", content: response.content });
      const results: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolUses.map(async (t) => ({
          type: "tool_result" as const,
          tool_use_id: t.id,
          content: JSON.stringify(await runReadOnlyTool(supabase, t.name, t.input, plan_id)),
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
