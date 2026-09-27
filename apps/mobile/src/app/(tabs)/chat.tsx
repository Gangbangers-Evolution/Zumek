import { colors, elevation, layout, radius, spacing, touchTarget, typography } from "@zumek/design-tokens";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "../../components/AppText";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Icon } from "../../components/Icon";
import { ChatMascot, MessageEntrance, ThinkingDots } from "../../features/chat/ChatMotion";
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

  const submit = (text = input) => {
    if (!text.trim() || sending) return;
    void send(text);
    setInput("");
  };

  const canSend = !sending && input.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            if (messages.length > 1) scrollRef.current?.scrollToEnd({ animated: false });
          }}
        >
          <View style={styles.column}>
            <MessageEntrance style={styles.welcome}>
              <ChatMascot size={messages.length === 1 ? 160 : 88} />
              <View style={styles.welcomeCopy}>
                <AppText variant="labelSm" tone="accent">TU COMPAÑERO DE COCINA</AppText>
                <AppText variant="headlineLg" style={styles.welcomeTitle}>{"Un poquito de ayuda,\nun montón de ideas."}</AppText>
                <AppText tone="muted">Tu semana, más rica y más fácil.</AppText>
              </View>
            </MessageEntrance>
            {CHAT_IS_DEMO ? <Badge label="Modo demo · respuestas preconfiguradas" tone="neutral" icon="smartToy" style={styles.centerSelf} /> : null}
            {messages.map((m) =>
              m.role === "user" ? (
                <MessageEntrance key={m.id} style={[styles.bubble, styles.user]}>
                  <AppText tone="onAccent">{m.text}</AppText>
                </MessageEntrance>
              ) : (
                <MessageEntrance key={m.id} style={styles.assistantRow}>
                  <ChatMascot size={36} animate={false} />
                  <View style={styles.assistantBody}>
                    <View style={[styles.bubble, styles.assistant]}>
                      <AppText variant="labelSm" tone="accent" style={styles.author}>ZUMEK</AppText>
                      <AppText tone={m.failed ? "danger" : "default"}>{m.text}</AppText>
                    </View>
                    {m.proposal ? <ProposalCard message={m} onApply={() => apply(m)} onReject={() => reject(m)} /> : null}
                  </View>
                </MessageEntrance>
              ),
            )}
            {messages.length === 1 && !sending ? (
              <MessageEntrance style={styles.suggestions}>
                <AppText variant="labelSm" tone="muted">¿POR DÓNDE EMPEZAMOS?</AppText>
                {[
                  { icon: "savings" as const, title: "Quiero ahorrar un poco", text: "Hazlo más barato", detail: "Busquemos opciones para tu presupuesto" },
                  { icon: "lightbulb" as const, title: "Cuéntame sobre mi semana", text: "¿Por qué armaste así el plan?", detail: "Conoce el porqué de tus recetas" },
                  { icon: "restaurant" as const, title: "Ajustemos mi presupuesto", text: "Quiero cambiar mi presupuesto", detail: "Hagamos espacio para lo que te gusta" },
                ].map((suggestion) => (
                  <Pressable key={suggestion.text} accessibilityRole="button" onPress={() => submit(suggestion.text)}
                    style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}>
                    <View style={styles.suggestionIcon}><Icon name={suggestion.icon} size={20} color={colors.primary} /></View>
                    <View style={styles.flex}><AppText variant="labelMd">{suggestion.title}</AppText><AppText variant="caption" tone="muted">{suggestion.detail}</AppText></View>
                    <Icon name="send" size={16} color={colors.primary} />
                  </Pressable>
                ))}
              </MessageEntrance>
            ) : null}
            {sending ? (
              <MessageEntrance style={styles.thinking} accessibilityLiveRegion="polite" accessibilityLabel="Zumek está pensando">
                <ChatMascot state="thinking" size={88} />
                <View style={styles.flex}>
                  <AppText variant="labelMd" tone="accent">Déjame pensar…</AppText>
                  <AppText variant="caption" tone="muted">Revisando tu semana con cariño.</AppText>
                  <ThinkingDots />
                </View>
              </MessageEntrance>
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
              onSubmitEditing={() => submit()}
              returnKeyType="send"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enviar mensaje"
              accessibilityState={{ disabled: !canSend }}
              disabled={!canSend}
              onPress={() => submit()}
              style={({ pressed }) => [styles.send, !canSend && styles.sendDisabled, pressed && styles.pressed]}
            >
              <Icon name="send" size={20} color={colors.onPrimaryContainer} />
            </Pressable>
          </View>
          <AppText variant="caption" tone="muted" style={styles.composerHint}>Los cambios a tu plan siempre los decides tú.</AppText>
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
      <View style={styles.proposalHeading}>
        <ChatMascot state="cooking" size={76} animate={state === "pending"} />
        <View style={styles.flex}>
          <AppText variant="labelSm" tone="accent">UNA IDEA PARA TU SEMANA</AppText>
          <AppText variant="headlineSm">¿Le damos este toque a tu plan?</AppText>
        </View>
      </View>
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
  scroll: { flexGrow: 1, padding: spacing.md, paddingBottom: spacing.lg },
  welcome: { alignItems: "center", paddingTop: spacing.sm, paddingBottom: spacing.sm, gap: spacing.md },
  welcomeCopy: { alignItems: "center", gap: spacing.sm },
  welcomeTitle: { textAlign: "center" },
  author: { marginBottom: 6 },
  suggestions: { gap: spacing.sm, paddingTop: spacing.sm },
  suggestion: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, minHeight: 72, borderRadius: 18, borderWidth: 1, borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLowest },
  suggestionIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: colors.primarySoft },
  thinking: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: "#fffdf5", borderRadius: 24, padding: 12, borderWidth: 1, borderColor: "#eee8d9" },
  proposalHeading: { flexDirection: "row", alignItems: "center", gap: 12 },
  composerHint: { textAlign: "center", marginTop: spacing.sm },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.85 },
  column: { width: "100%", maxWidth: layout.maxContentWidth, alignSelf: "center", gap: spacing.md },
  bubble: { maxWidth: "88%", paddingHorizontal: spacing.md, paddingVertical: 14, borderRadius: 20 },
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
  proposal: { gap: 12, borderRadius: 24, borderColor: colors.outlineVariant, ...elevation.floating },
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
