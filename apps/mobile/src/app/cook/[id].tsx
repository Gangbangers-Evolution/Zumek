import { colors, radius, spacing, typography } from "@zumek/design-tokens";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../../components/AppText";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Icon } from "../../components/Icon";
import { ProgressBar } from "../../components/ProgressBar";
import { Screen } from "../../components/Screen";
import { EXAMPLES } from "../../features/examples";
import { useCatalog } from "../../state/catalog";

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function CookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const catalog = useCatalog();
  // El id viene de la URL: puede no existir, por eso get() y no lookup()
  const recipe = catalog.recipeById.get(id);
  const steps = catalog.stepsByRecipe.get(id) ?? [];
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
  const percent = Math.round(((index + 1) / steps.length) * 100);

  return (
    <Screen
      footer={
        <View style={styles.row}>
          <View style={styles.flex}>
            <Button
              label="Anterior"
              variant="secondary"
              icon="arrowBack"
              disabled={index === 0}
              onPress={() => setIndex((i) => i - 1)}
            />
          </View>
          <View style={styles.flex}>
            <Button
              label={isLast ? "Terminar" : "Siguiente"}
              trailingIcon={isLast ? "check" : "arrowForward"}
              onPress={() => (isLast ? router.back() : setIndex((i) => i + 1))}
            />
          </View>
        </View>
      }
    >
      <Stack.Screen options={{ title: "Modo cocina" }} />
      <View style={styles.titleRow}>
        <AppText variant="headlineMd" style={styles.flex}>
          {recipe.name}
        </AppText>
        <AppText variant="caption" tone="muted">
          {percent}% completado
        </AppText>
      </View>
      <ProgressBar value={index + 1} max={steps.length} label={`Paso ${index + 1} de ${steps.length}`} height={8} />

      <Card>
        <Badge label={`Paso ${index + 1} de ${steps.length}`} tone="accent" />
        <AppText variant="headlineSm" tone="muted">
          {step.title}
        </AppText>
        <AppText variant="headlineLg" accessibilityRole="header">
          {step.content}
        </AppText>
      </Card>

      {step.timer_seconds !== null ? (
        // key: cada paso arranca con su propio temporizador desde el primer render
        <StepTimer key={step.id} seconds={step.timer_seconds} />
      ) : null}

      <Card tone="warning">
        <View style={styles.row}>
          <Icon name="lightbulb" color={colors.onTertiaryFixed} />
          <View style={styles.flex}>
            <AppText variant="labelMd" style={{ color: colors.onTertiaryFixed }}>
              Consejo del chef
            </AppText>
            <AppText style={{ color: colors.onTertiaryFixed }}>{EXAMPLES.chefTip}</AppText>
          </View>
        </View>
      </Card>
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
    <Card style={styles.timer}>
      <AppText
        style={[styles.time, remaining === 0 && { color: colors.secondary }]}
        accessibilityLabel={`Temporizador: ${formatTimer(remaining)}`}
        accessibilityLiveRegion="polite"
      >
        {remaining === 0 ? "¡Listo!" : formatTimer(remaining)}
      </AppText>
      <ProgressBar value={seconds - remaining} max={seconds} label="Tiempo transcurrido" tone="savings" />
      <View style={styles.row}>
        <View style={styles.flex}>
          <Button
            label={running ? "Pausar" : "Iniciar"}
            icon={running ? "pause" : "play"}
            variant={running ? "secondary" : "primary"}
            disabled={remaining === 0}
            onPress={() => setStarted(!running)}
            accessibilityLabel={running ? "Pausar temporizador" : "Iniciar temporizador"}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reiniciar temporizador"
          onPress={() => {
            setStarted(false);
            setRemaining(seconds);
          }}
          style={styles.reset}
        >
          <Icon name="refresh" color={colors.onSurface} />
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  flex: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  timer: { alignItems: "stretch", gap: spacing.md },
  time: { ...typography.currencyHero, fontSize: 48, lineHeight: 56, textAlign: "center", color: colors.onSurface },
  reset: {
    width: 48,
    height: 48,
    borderRadius: radius.control,
    backgroundColor: colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
});
