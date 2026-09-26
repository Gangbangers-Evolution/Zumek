import { colors, radius, spacing, typography } from "@zumek/design-tokens";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../../components/AppText";
import { Button } from "../../components/Button";
import { ProgressBar } from "../../components/ProgressBar";
import { Screen } from "../../components/Screen";
import { useCatalog } from "../../state/catalog";

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function CookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const catalog = useCatalog();
  const recipe = catalog.recipes.find((r) => r.id === id);
  const steps = catalog.recipe_steps
    .filter((s) => s.recipe_id === id)
    .sort((a, b) => a.step_order - b.step_order);
  const [index, setIndex] = useState(0);
  const step = steps[index];

  if (!recipe || !step) {
    return (
      <Screen>
        <AppText>No encontramos los pasos de esta receta.</AppText>
      </Screen>
    );
  }

  const isLast = index === steps.length - 1;

  return (
    <Screen
      footer={
        <View style={styles.row}>
          <View style={styles.flex}>
            <Button
              label="Anterior"
              variant="secondary"
              disabled={index === 0}
              onPress={() => setIndex((i) => i - 1)}
            />
          </View>
          <View style={styles.flex}>
            <Button
              label={isLast ? "Terminar" : "Siguiente"}
              onPress={() => (isLast ? router.back() : setIndex((i) => i + 1))}
            />
          </View>
        </View>
      }
    >
      <Stack.Screen options={{ title: recipe.name }} />
      <ProgressBar current={index + 1} total={steps.length} />
      <AppText variant="caption" tone="secondary">
        Paso {index + 1} de {steps.length}
      </AppText>
      <AppText variant="title" accessibilityRole="header">
        {step.title}
      </AppText>
      <AppText style={styles.content}>{step.content}</AppText>

      {step.timer_seconds !== null ? (
        // key: cada paso arranca con su propio temporizador desde el primer render
        <StepTimer key={step.id} seconds={step.timer_seconds} />
      ) : null}
    </Screen>
  );
}

function StepTimer({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(seconds);
  const [started, setStarted] = useState(false);
  // Al llegar a cero se detiene solo: "corriendo" se deriva, no se sincroniza con un efecto.
  const running = started && remaining > 0;

  useEffect(() => {
    if (!running) return;
    const handle = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(handle);
  }, [running]);

  return (
    <View style={styles.timer}>
      <AppText
        variant="title"
        tone={remaining === 0 ? "success" : "primary"}
        accessibilityLabel={`Temporizador: ${formatTimer(remaining)}`}
        accessibilityLiveRegion="polite"
      >
        {remaining === 0 ? "¡Listo!" : formatTimer(remaining)}
      </AppText>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Button
            label={running ? "Pausar" : "Iniciar"}
            variant="secondary"
            disabled={remaining === 0}
            onPress={() => setStarted(!running)}
            accessibilityLabel={running ? "Pausar temporizador" : "Iniciar temporizador"}
          />
        </View>
        <View style={styles.flex}>
          <Button
            label="Reiniciar"
            variant="ghost"
            onPress={() => {
              setStarted(false);
              setRemaining(seconds);
            }}
            accessibilityLabel="Reiniciar temporizador"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.sm },
  flex: { flex: 1 },
  content: { fontSize: typography.fontSize.lg, lineHeight: typography.fontSize.lg * typography.lineHeight.normal },
  timer: {
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
