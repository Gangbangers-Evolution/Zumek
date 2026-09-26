import { colors, layout, radius, spacing, touchTarget, typography } from "@zumek/design-tokens";
import { useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { applyProposal, sendChatMessage, type ChangeProposal } from "../data/chat-source";
import { formatDeltaCents } from "../lib/money";

type ProposalState = "pending" | "applying" | "applied" | "rejected" | "error";

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
  proposal?: ChangeProposal;
  proposalState?: ProposalState;
  failed?: boolean;
}

const GENERIC_ERROR = "No pude procesar eso, ¿puedes reformular?";

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      text: "Hola, soy Zumek. Puedo cambiar recetas, ajustar tu presupuesto o explicarte por qué armé así tu semana.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [focused, setFocused] = useState(false);
  const nextId = useRef(1);
  const scrollRef = useRef<ScrollView>(null);

  const push = (message: Omit<Message, "id">) =>
    setMessages((prev) => [...prev, { ...message, id: nextId.current++ }]);

  const update = (id: number, patch: Partial<Message>) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    push({ role: "user", text });
    try {
      const reply = await sendChatMessage(text);
      push({
        role: "assistant",
        text: reply.text,
        proposal: reply.proposal,
        proposalState: reply.proposal ? "pending" : undefined,
      });
    } catch {
      push({ role: "assistant", text: GENERIC_ERROR, failed: true });
    } finally {
      setSending(false);
    }
  };

  const apply = async (message: Message) => {
    if (!message.proposal) return;
    update(message.id, { proposalState: "applying" });
    try {
      await applyProposal(message.proposal);
      update(message.id, { proposalState: "applied" });
    } catch {
      update(message.id, { proposalState: "error" });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          <View style={styles.column}>
            {messages.map((m) => (
              <View key={m.id} style={[styles.bubble, m.role === "user" ? styles.user : styles.assistant]}>
                <AppText tone={m.role === "user" ? "inverse" : m.failed ? "danger" : "primary"}>{m.text}</AppText>
                {m.proposal ? <ProposalCard message={m} onApply={() => apply(m)} onReject={() => update(m.id, { proposalState: "rejected" })} /> : null}
              </View>
            ))}
            {sending ? (
              <View style={[styles.bubble, styles.assistant]} accessibilityLabel="Zumek está escribiendo">
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.composerBar}>
          <View style={[styles.column, styles.composer]}>
            <TextInput
              accessibilityLabel="Mensaje para Zumek"
              style={[styles.input, focused && styles.inputFocused]}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              value={input}
              onChangeText={setInput}
              placeholder="Ej. hazlo más barato"
              placeholderTextColor={colors.textSecondary}
              editable={!sending}
              onSubmitEditing={send}
              returnKeyType="send"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enviar mensaje"
              accessibilityState={{ disabled: sending || !input.trim() }}
              disabled={sending || !input.trim()}
              onPress={send}
              style={[styles.send, (sending || !input.trim()) && styles.sendDisabled]}
            >
              <Text style={styles.sendText}>↑</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ProposalCard({
  message,
  onApply,
  onReject,
}: {
  message: Message;
  onApply: () => void;
  onReject: () => void;
}) {
  const proposal = message.proposal!;
  const state = message.proposalState ?? "pending";
  return (
    <View style={styles.proposal}>
      <AppText variant="label">¿Aplicar este cambio?</AppText>
      <AppText>{proposal.description}</AppText>
      <AppText variant="label" tone={proposal.deltaCents <= 0 ? "success" : "warning"}>
        {formatDeltaCents(proposal.deltaCents)}
      </AppText>
      {state === "pending" || state === "applying" || state === "error" ? (
        <>
          {state === "error" ? (
            <AppText variant="caption" tone="danger">
              No se pudo aplicar el cambio. Inténtalo de nuevo.
            </AppText>
          ) : null}
          <View style={styles.row}>
            <View style={styles.flex}>
              <Button label="No" variant="secondary" disabled={state === "applying"} onPress={onReject} accessibilityLabel="No aplicar el cambio" />
            </View>
            <View style={styles.flex}>
              <Button label="Aplicar" loading={state === "applying"} onPress={onApply} accessibilityLabel="Aplicar el cambio" />
            </View>
          </View>
        </>
      ) : (
        <AppText variant="caption" tone={state === "applied" ? "success" : "secondary"}>
          {state === "applied" ? "Cambio aplicado" : "Cambio descartado"}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  row: { flexDirection: "row", gap: spacing.sm },
  scroll: { flexGrow: 1, padding: spacing.md },
  column: { width: "100%", maxWidth: layout.maxContentWidth, alignSelf: "center", gap: spacing.sm },
  bubble: { maxWidth: "85%", padding: spacing.md, borderRadius: radius.lg, gap: spacing.sm },
  user: { alignSelf: "flex-end", backgroundColor: colors.primary },
  assistant: { alignSelf: "flex-start", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  proposal: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  composerBar: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.sm,
  },
  composer: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  input: {
    flex: 1,
    minHeight: touchTarget.min,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    outlineStyle: "solid",
    outlineWidth: 0,
  },
  inputFocused: { borderColor: colors.primary, borderWidth: 2 },
  send: {
    width: touchTarget.min,
    height: touchTarget.min,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: { opacity: 0.5 },
  sendText: { color: colors.onPrimary, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
});
