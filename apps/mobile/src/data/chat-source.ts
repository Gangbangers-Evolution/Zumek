// Chat y asistente de cocina. Dos modos, segun EXPO_PUBLIC_CHAT_MODE:
// - "ia": la Edge Function 'chat' (Fase 6) con el LLM. Requiere Supabase.
// - cualquier otro valor (por defecto): respuestas preconfiguradas en el dispositivo.
// En los dos, las propuestas de cambio las calcula el planner, nunca un texto fijo.
import type { IndexedCatalog } from "@zumek/domain";
import { askChat, type ChatReply, type ChatRequest } from "@zumek/supabase-client";
import { scriptedReply } from "../features/chat/scripted";
import type { ActivePlan } from "./plan-source";
import { getSupabase } from "./supabase";

export { ChatError, type ChatProposal, type ChatTurn } from "@zumek/supabase-client";

const WANTS_IA = process.env.EXPO_PUBLIC_CHAT_MODE === "ia";

/** true: el chat responde con textos preconfigurados (la UI lo avisa). */
export const CHAT_IS_DEMO = !WANTS_IA || !process.env.EXPO_PUBLIC_SUPABASE_URL;

export async function askZumek(request: ChatRequest, active: ActivePlan, catalog: IndexedCatalog): Promise<ChatReply> {
  // El cliente se pide al usarse, no al importar (en web el import corre sin window).
  const supabase = CHAT_IS_DEMO ? null : getSupabase();
  if (supabase) return askChat(supabase, request);
  // Pausa corta para que se note el "escribiendo"; el calculo es instantaneo.
  await new Promise((resolve) => setTimeout(resolve, 700));
  return scriptedReply(request.messages.at(-1)?.content ?? "", { active, catalog, cooking: request.cooking });
}
