import { colors, elevation, layout, radius, spacing, touchTarget, typography } from "@zumek/design-tokens";
import { useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "../../components/AppText";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Icon } from "../../components/Icon";
import { IconTile } from "../../components/IconTile";
import { CHAT_IS_DEMO } from "../../data/chat-source";
import { EXAMPLES } from "../../features/examples";
import { useAssistant, type AssistantMessage } from "../../features/chat/use-assistant";
import { formatCents, formatDeltaCents } from "../../lib/money";

export default function ChatScreen() {
  const { messages, sending, send, apply, reject } = useAssistant({
    greeting: "Hola, soy Zumek. Puedo cambiar recetas o ingredientes, ajustar tu presupuesto o explicarte por qué armé así tu semana.",
  });
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const submit = () => {
    if (!input.trim() || sending) return;
    void send(input);
    setInput("");
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
            {CHAT_IS_DEMO ? <Badge label="Modo demo · respuestas preconfiguradas" tone="neutral" icon="smartToy" style={styles.centerSelf} /> : null}
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
                    {m.proposal ? <ProposalCard message={m} onApply={() => apply(m)} onReject={() => reject(m)} /> : null}
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
              onSubmitEditing={submit}
              returnKeyType="send"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enviar mensaje"
              accessibilityState={{ disabled: !canSend }}
              disabled={!canSend}
              onPress={submit}
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
  message: AssistantMessage;
  onApply: () => void;
  onReject: () => void;
}) {
  const proposal = message.proposal!;
  if (proposal.state === "unavailable") {
    return (
      <Card tone="warning">
        <AppText style={{ color: colors.onTertiaryFixed }}>{proposal.reason}</AppText>
      </Card>
    );
  }
  const { change, state } = proposal;
  const saves = change.deltaCents <= 0;
  return (
    <Card style={styles.proposal}>
      <AppText variant="labelSm" tone="savings">
        PROPUESTA INTELIGENTE
      </AppText>
      <AppText variant="headlineSm">¿Aplicar este cambio al plan?</AppText>
      <AppText tone="muted">{change.description}</AppText>
      <Card tone={saves ? "savings" : "warning"}>
        <AppText variant="headlineSm" style={{ color: saves ? colors.onSecondaryContainer : colors.onTertiaryFixed }}>
          {change.deltaCents === 0
            ? "Cuesta lo mismo"
            : saves
              ? `¡Ahorras ${formatCents(-change.deltaCents)} en este cambio!`
              : `Cuesta ${formatCents(change.deltaCents)} más`}
        </AppText>
        <AppText variant="caption" style={{ color: saves ? colors.onSecondaryContainer : colors.onTertiaryFixed }}>
          Nuevo total de tu lista: {formatCents(change.next.bundle.plan.total_cost_cents)} ({formatDeltaCents(change.deltaCents)})
        </AppText>
      </Card>
      <View style={styles.note}>
        <Icon name="lightbulb" size={16} color={colors.tertiary} />
        <AppText variant="caption" tone="muted" style={styles.flex}>
          {EXAMPLES.proposalNote}
        </AppText>
      </View>
      {state === "pending" ? (
        <>
          <Button label="Aplicar cambio al plan" icon="check" onPress={onApply} accessibilityLabel="Aplicar el cambio" />
          <Button label="Cancelar y mantener el anterior" variant="text" onPress={onReject} accessibilityLabel="No aplicar el cambio" />
        </>
      ) : (
        <AppText variant="labelMd" tone={state === "applied" ? "savings" : "muted"}>
          {state === "applied"
            ? "Cambio aplicado"
            : state === "stale"
              ? "Tu plan cambió desde esta propuesta; pídela de nuevo."
              : "Cambio descartado"}
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
  centerSelf: { alignSelf: "center" },
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
