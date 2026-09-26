// Chat y asistente de cocina: con Supabase configurado habla con la Edge Function 'chat'
// (Fase 6). Sin Supabase (desarrollo con datos de ejemplo) responde un demo local que
// propone cambios reales: el costo siempre lo calcula el planner, nunca un texto fijo.
import type { PlanBundle } from "@zumek/domain";
import { askChat, type ChatReply, type ChatRequest } from "@zumek/supabase-client";
import { getSupabase } from "./supabase";

export { ChatError, type ChatProposal, type ChatTurn } from "@zumek/supabase-client";

export async function askZumek(request: ChatRequest, bundle: PlanBundle): Promise<ChatReply> {
  const supabase = getSupabase();
  if (supabase) return askChat(supabase, request);
  return offlineDemo(request, bundle);
}

async function offlineDemo(request: ChatRequest, bundle: PlanBundle): Promise<ChatReply> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  if (request.cooking) {
    return { text: "El asistente de cocina necesita conexión. Mientras tanto, sigue el paso en pantalla." };
  }
  const text = request.messages.at(-1)?.content.toLowerCase() ?? "";
  const meal = bundle.meals[0];
  if (meal && /barat|ahorr|cambi/.test(text)) {
    return {
      text: "Modo sin conexión: te propongo cambiar la primera comida de tu semana.",
      proposal: {
        tool: "swap_recipe",
        input: { day_index: meal.day_index, meal_type: meal.meal_type, exclude_recipe_id: meal.recipe_id },
      },
    };
  }
  return {
    text: 'Modo sin conexión: puedo proponerte cambios básicos. Prueba con "hazlo más barato".',
  };
}
