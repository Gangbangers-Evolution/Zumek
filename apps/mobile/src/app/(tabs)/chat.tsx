import { colors, elevation, layout, radius, spacing, touchTarget, typography } from "@zumek/design-tokens";
import { useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "../../components/AppText";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Icon } from "../../components/Icon";
import { IconTile } from "../../components/IconTile";
import { applyProposal, sendChatMessage, type ChangeProposal } from "../../data/chat-source";
import { EXAMPLES } from "../../features/examples";
import { formatCents, formatDeltaCents } from "../../lib/money";

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

  const canSend = !sending && input.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          <View style={styles.column}>
            {messages.map((m) =>
              m.role === "user" ? (
                <View key={m.id} style={[styles.bubble, styles.user]}>
                  <AppText tone="onAccent">{m.text}</AppText>
                </View>
              ) : (
                <View key={m.id} style={styles.assistantRow}>
                  <IconTile name="smartToy" size={32} />
                  <View style={styles.assistantBody}>
                    <View style={[styles.bubble, styles.assistant]}>
                      <AppText tone={m.failed ? "danger" : "default"}>{m.text}</AppText>
                    </View>
                    {m.proposal ? (
                      <ProposalCard message={m} onApply={() => apply(m)} onReject={() => update(m.id, { proposalState: "rejected" })} />
                    ) : null}
                  </View>
                </View>
              ),
            )}
            {sending ? (
              <View style={styles.assistantRow} accessibilityLabel="Zumek está escribiendo">
                <IconTile name="smartToy" size={32} />
                <View style={[styles.bubble, styles.assistant]}>
                  <ActivityIndicator color={colors.primary} />
                </View>
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
              placeholderTextColor={colors.outline}
              editable={!sending}
              onSubmitEditing={send}
              returnKeyType="send"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enviar mensaje"
              accessibilityState={{ disabled: !canSend }}
              disabled={!canSend}
              onPress={send}
              style={[styles.send, !canSend && styles.sendDisabled]}
            >
              <Icon name="send" size={20} color={colors.onPrimaryContainer} />
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
  const saves = proposal.deltaCents <= 0;
  return (
    <Card style={styles.proposal}>
      <AppText variant="labelSm" tone="savings">
        PROPUESTA INTELIGENTE
      </AppText>
      <AppText variant="headlineSm">¿Aplicar este cambio al plan?</AppText>
      <AppText tone="muted">{proposal.description}</AppText>
      <Card tone={saves ? "savings" : "warning"}>
        <AppText variant="headlineSm" style={{ color: saves ? colors.onSecondaryContainer : colors.onTertiaryFixed }}>
          {saves ? `¡Ahorras ${formatCents(-proposal.deltaCents)} en este cambio!` : `Cuesta ${formatCents(proposal.deltaCents)} más`}
        </AppText>
        <AppText variant="caption" style={{ color: saves ? colors.onSecondaryContainer : colors.onTertiaryFixed }}>
          Diferencia en tu lista de compras: {formatDeltaCents(proposal.deltaCents)}
        </AppText>
      </Card>
      <View style={styles.note}>
        <Icon name="lightbulb" size={16} color={colors.tertiary} />
        <AppText variant="caption" tone="muted" style={styles.flex}>
          {EXAMPLES.proposalNote}
        </AppText>
      </View>
      {state === "pending" || state === "applying" || state === "error" ? (
        <>
          {state === "error" ? (
            <AppText variant="caption" tone="danger">
              No se pudo aplicar el cambio. Inténtalo de nuevo.
            </AppText>
          ) : null}
          <Button label="Aplicar cambio al plan" icon="check" loading={state === "applying"} onPress={onApply} accessibilityLabel="Aplicar el cambio" />
          <Button label="Cancelar y mantener el anterior" variant="text" disabled={state === "applying"} onPress={onReject} accessibilityLabel="No aplicar el cambio" />
        </>
      ) : (
        <AppText variant="labelMd" tone={state === "applied" ? "savings" : "muted"}>
          {state === "applied" ? "Cambio aplicado" : "Cambio descartado"}
        </AppText>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing.md },
  column: { width: "100%", maxWidth: layout.maxContentWidth, alignSelf: "center", gap: spacing.md },
  bubble: { maxWidth: "88%", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.card },
  user: { alignSelf: "flex-end", backgroundColor: colors.primaryContainer, borderBottomRightRadius: radius.sm },
  assistantRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  assistantBody: { flex: 1, gap: spacing.sm },
  assistant: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.divider,
    borderTopLeftRadius: radius.sm,
  },
  proposal: { gap: spacing.sm, ...elevation.floating },
  note: { flexDirection: "row", gap: spacing.xs, alignItems: "flex-start" },
  composerBar: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.sm,
  },
  composer: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  input: {
    flex: 1,
    minHeight: touchTarget.button,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surfaceContainerLow,
    ...typography.bodyLg,
    color: colors.onSurface,
    outlineStyle: "solid",
    outlineWidth: 0,
  },
  inputFocused: { borderColor: colors.primaryContainer, boxShadow: `0 0 0 3px ${colors.primaryFixed}` },
  send: {
    width: touchTarget.button,
    height: touchTarget.button,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: { opacity: 0.45 },
});
