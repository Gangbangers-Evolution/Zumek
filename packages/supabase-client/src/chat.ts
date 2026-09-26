// Contrato con la Edge Function 'chat' (supabase/functions/chat). La funcion solo PROPONE
// cambios; la app los calcula con el planner y los aplica si el usuario confirma.
import { MEAL_TYPES, type MealType } from "@zumek/domain";
import type { ZumekClient } from "./index";

export type ChatProposal =
  | { tool: "update_budget"; input: { new_budget_cents: number } }
  | { tool: "swap_recipe"; input: { day_index: number; meal_type: MealType; exclude_recipe_id: string } }
  | { tool: "swap_ingredient"; input: { recipe_id: string; canonical_product_id: string; reason: string } };

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatReply {
  text: string;
  proposal?: ChatProposal;
}

export interface ChatRequest {
  messages: ChatTurn[];
  planId: string;
  /** Asistente de cocina: receta y paso (desde 0) en pantalla. */
  cooking?: { recipeId: string; stepIndex: number };
}

/** Errores que la UI distingue; el resto es "no pude procesar eso". */
export type ChatErrorCode = "rate_limited" | "plan_not_found" | "failed";

export class ChatError extends Error {
  constructor(readonly code: ChatErrorCode) {
    super(`chat: ${code}`);
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

/** La respuesta viene de la red: se revisa la forma antes de confiar en ella. */
function parseProposal(raw: unknown): ChatProposal | undefined {
  if (!isRecord(raw) || !isRecord(raw.input)) return undefined;
  const input = raw.input;
  switch (raw.tool) {
    case "update_budget":
      return Number.isInteger(input.new_budget_cents) && (input.new_budget_cents as number) > 0
        ? { tool: "update_budget", input: { new_budget_cents: input.new_budget_cents as number } }
        : undefined;
    case "swap_recipe":
      return Number.isInteger(input.day_index) &&
        MEAL_TYPES.includes(input.meal_type as MealType) &&
        typeof input.exclude_recipe_id === "string"
        ? {
            tool: "swap_recipe",
            input: {
              day_index: input.day_index as number,
              meal_type: input.meal_type as MealType,
              exclude_recipe_id: input.exclude_recipe_id,
            },
          }
        : undefined;
    case "swap_ingredient":
      return typeof input.recipe_id === "string" && typeof input.canonical_product_id === "string"
        ? {
            tool: "swap_ingredient",
            input: {
              recipe_id: input.recipe_id,
              canonical_product_id: input.canonical_product_id,
              reason: typeof input.reason === "string" ? input.reason : "",
            },
          }
        : undefined;
    default:
      return undefined;
  }
}

export async function askChat(client: ZumekClient, request: ChatRequest): Promise<ChatReply> {
  const { data, error } = await client.functions.invoke("chat", {
    body: {
      messages: request.messages,
      plan_id: request.planId,
      ...(request.cooking && { cooking: { recipe_id: request.cooking.recipeId, step_index: request.cooking.stepIndex } }),
    },
  });
  if (error) {
    // El cuerpo distingue el plan no encontrado de una funcion que no esta desplegada (ambos 404).
    const context = (error as { context?: Response }).context;
    const body: unknown = await context?.json().catch(() => null);
    const code = isRecord(body) ? body.error : undefined;
    throw new ChatError(code === "rate_limited" || code === "plan_not_found" ? code : "failed");
  }
  if (!isRecord(data) || typeof data.text !== "string") throw new ChatError("failed");
  return { text: data.text, proposal: parseProposal(data.proposal) };
}
