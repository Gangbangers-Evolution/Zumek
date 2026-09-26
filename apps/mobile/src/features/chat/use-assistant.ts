// Conversacion con Zumek (chat y asistente de cocina). Las propuestas de cambio se
// calculan con el planner al llegar y solo se aplican si el usuario confirma.
import { useEffect, useRef, useState } from "react";
import { askZumek, ChatError, type ChatTurn } from "../../data/chat-source";
import { computeChange, type PlanChange } from "../../data/plan-changes";
import { useCatalog } from "../../state/catalog";
import { useWeek } from "../../state/week";

export type Proposal =
  | { state: "pending" | "applied" | "rejected" | "stale"; change: PlanChange }
  /** La IA propuso algo que el planner no puede cumplir: se explica y no hay boton. */
  | { state: "unavailable"; reason: string };

export interface AssistantMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  failed?: boolean;
  proposal?: Proposal;
}

const ERROR_TEXT: Record<ChatError["code"], string> = {
  rate_limited: "Vas muy rápido. Espera un minuto y vuelve a intentarlo.",
  plan_not_found: "Tu plan todavía se está guardando. Intenta de nuevo en unos segundos.",
  failed: "No pude procesar eso, ¿puedes reformular?",
};

export function useAssistant({ greeting, cooking }: { greeting: string; cooking?: { recipeId: string; stepIndex: number } }) {
  const { active, planChanged } = useWeek();
  const catalog = useCatalog();
  const [messages, setMessages] = useState<AssistantMessage[]>([{ id: 0, role: "assistant", text: greeting }]);
  const [sending, setSending] = useState(false);
  const nextId = useRef(1);
  // La respuesta llega despues: se calcula contra el plan vigente en ese momento.
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const push = (message: Omit<AssistantMessage, "id">) =>
    setMessages((prev) => [...prev, { ...message, id: nextId.current++ }]);
  const setProposal = (id: number, proposal: Proposal) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, proposal } : m)));

  const send = async (raw: string) => {
    const text = raw.trim();
    const plan = activeRef.current;
    if (!text || sending || !plan) return;
    setSending(true);
    push({ role: "user", text });
    // Historial solo de texto; el saludo local y los errores no son parte de la conversacion.
    const history: ChatTurn[] = [
      ...messages.filter((m) => m.id !== 0 && !m.failed).map((m) => ({ role: m.role, content: m.text })),
      { role: "user", content: text },
    ];
    try {
      const reply = await askZumek({ messages: history, planId: plan.bundle.plan.id, cooking }, plan.bundle);
      const current = activeRef.current;
      let proposal: Proposal | undefined;
      // En modo cocina no se cambia el plan: solo se responden dudas.
      if (reply.proposal && current && !cooking) {
        const result = computeChange(reply.proposal, current, catalog);
        proposal = result.ok ? { state: "pending", change: result.change } : { state: "unavailable", reason: result.reason };
      }
      push({ role: "assistant", text: reply.text, proposal });
    } catch (error) {
      push({ role: "assistant", text: ERROR_TEXT[error instanceof ChatError ? error.code : "failed"], failed: true });
    } finally {
      setSending(false);
    }
  };

  const apply = (message: AssistantMessage) => {
    const proposal = message.proposal;
    if (proposal?.state !== "pending") return;
    // Si el plan cambio desde que se calculo la propuesta, ya no corresponde aplicarla.
    if (activeRef.current?.bundle.plan.id !== proposal.change.basePlanId) {
      setProposal(message.id, { ...proposal, state: "stale" });
      return;
    }
    planChanged(proposal.change.next);
    setProposal(message.id, { ...proposal, state: "applied" });
  };

  const reject = (message: AssistantMessage) => {
    if (message.proposal?.state === "pending") setProposal(message.id, { ...message.proposal, state: "rejected" });
  };

  return { messages, sending, send, apply, reject };
}
