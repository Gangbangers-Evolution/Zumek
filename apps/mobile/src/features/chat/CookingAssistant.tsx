import { spacing } from "@zumek/design-tokens";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../../components/AppText";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ChatMascot, MessageEntrance, ThinkingDots } from "./ChatMotion";
import { TextField } from "../../components/TextField";
import { useAssistant } from "./use-assistant";

/** Asistente de cocina en texto (seccion 6): dudas sobre el paso en pantalla, sin cambiar el plan. */
export function CookingAssistant({ recipeId, stepIndex }: { recipeId: string; stepIndex: number }) {
  const { messages, sending, send } = useAssistant({
    greeting: "¿Dudas con este paso? Pregúntame, por ejemplo: ¿cómo sé que ya está listo?",
    cooking: { recipeId, stepIndex },
  });
  const [input, setInput] = useState("");
  // Solo la ultima respuesta: en la cocina se lee de un vistazo, no se repasa un historial.
  const last = messages.at(-1)!;

  const submit = () => {
    if (!input.trim() || sending) return;
    void send(input);
    setInput("");
  };

  return (
    <Card>
      <View style={styles.row}>
        <ChatMascot state={sending ? "thinking" : "cooking"} size={76} />
        <View style={styles.flex} accessibilityLiveRegion="polite">
          {sending ? (
            <View accessibilityLabel="Zumek está pensando"><AppText variant="labelMd" tone="accent">Vamos paso a paso…</AppText><ThinkingDots /></View>
          ) : (
            <MessageEntrance key={last.id}><AppText tone={last.failed ? "danger" : "default"}>{last.role === "assistant" ? last.text : ""}</AppText></MessageEntrance>
          )}
        </View>
      </View>
      <TextField
        label="Pregunta para Zumek sobre este paso"
        hideLabel
        placeholder="Ej. ¿puedo usar otra olla?"
        value={input}
        onChangeText={setInput}
        editable={!sending}
        onSubmitEditing={submit}
        returnKeyType="send"
      />
      <Button label="Preguntar" icon="send" variant="secondary" disabled={sending || !input.trim()} onPress={submit} />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  flex: { flex: 1 },
});
