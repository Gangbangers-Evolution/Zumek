// Fase 1: respuestas simuladas. En Fase 6 esto llama a la Edge Function 'chat'.
import { delay } from "./fake";

export interface ChangeProposal {
  description: string;
  deltaCents: number;
}

export interface ChatReply {
  text: string;
  proposal?: ChangeProposal;
}

export async function sendChatMessage(message: string): Promise<ChatReply> {
  await delay(900);
  const text = message.toLowerCase();
  if (text.includes("barat") || text.includes("ahorr")) {
    return {
      text: "Puedo cambiar el spaghetti del día 2 por enfrijoladas, que reutilizan la tortilla y el queso que ya compras.",
      proposal: {
        description: "Día 2, comida: Spaghetti con jitomate → Enfrijoladas",
        deltaCents: -2150,
      },
    };
  }
  return {
    text: "Puedo ayudarte a cambiar recetas, ajustar el presupuesto o explicarte el plan. Prueba con: \"hazlo más barato\".",
  };
}

export async function applyProposal(_proposal: ChangeProposal): Promise<void> {
  await delay(700);
}
