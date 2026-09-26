import { colors, layout, radius, spacing } from "@zumek/design-tokens";
import type { PlanBundle } from "@zumek/domain";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "../components/AppText";
import { ErrorState } from "../components/AsyncStates";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Icon } from "../components/Icon";
import { IconTile } from "../components/IconTile";
import { generatePlan } from "../data/plan-source";
import { EXAMPLES } from "../features/examples";
import { formatCents } from "../lib/money";
import { useCatalog } from "../state/catalog";
import { useOnboarding } from "../state/onboarding";
import { useWeek } from "../state/week";

export default function Generating() {
  const { state } = useOnboarding();
  const catalog = useCatalog();
  const { planGenerated } = useWeek();
  const [result, setResult] = useState<{ attempt: number; outcome: "done" | "failed" } | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    generatePlan(state, catalog)
      .then((bundle: PlanBundle) => {
        if (cancelled) return;
        planGenerated(bundle, state.pantry);
        setResult({ attempt, outcome: "done" });
      })
      .catch(() => !cancelled && setResult({ attempt, outcome: "failed" }));
    return () => {
      cancelled = true;
    };
    // Solo se genera al entrar o al reintentar, no en cada cambio de estado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const outcome = result?.attempt === attempt ? result.outcome : "working";
  if (outcome === "failed") {
    return (
      <ErrorState
        title="No pudimos generar tu plan"
        message="Ocurrió un problema al armar la semana. Tus respuestas siguen guardadas."
        onRetry={retry}
      />
    );
  }

  const done = outcome === "done";
  const budget = formatCents(state.budgetCents ?? 0);
  const pantryItems = Object.keys(state.pantry).length;
  const storeNames = catalog.stores.filter((s) => state.storeIds.includes(s.id)).map((s) => s.name);
  const steps = [
    { title: "Revisando tu presupuesto", detail: `Objetivo: ${budget}` },
    { title: "Analizando tu despensa", detail: `${pantryItems} ${pantryItems === 1 ? "ingrediente" : "ingredientes"} en casa` },
    { title: "Comparando precios", detail: storeNames.join(" vs. ") || "Tus tiendas" },
    { title: "Optimizando la lista de compras", detail: "Paquetes completos y reutilización" },
    { title: "Armando las recetas", detail: `Para ${state.peopleCount} personas y ${state.daysCount} días` },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.column}>
          <View style={styles.hero}>
            <View style={styles.mascot}>
              <Icon name="restaurant" size={44} color={colors.primary} />
            </View>
            <Badge label={budget} tone="savings" icon="savings" />
            <AppText variant="headlineLg" style={styles.center} accessibilityRole="header">
              {done ? "¡Tu plan está listo!" : "Creando tu plan a la medida…"}
            </AppText>
            <AppText tone="muted" style={styles.center}>
              Combinamos tus preferencias, despensa y presupuesto de {budget}.
            </AppText>
          </View>

          <Card>
            <AppText variant="labelSm" tone="muted">
              PASOS DE CÁLCULO
            </AppText>
            {steps.map((step) => (
              <View key={step.title} style={styles.step}>
                {done ? <IconTile name="check" tone="savings" size={28} /> : <ActivityIndicator color={colors.primary} />}
                <View style={styles.flex}>
                  <AppText variant="bodyMdMedium">{step.title}</AppText>
                  <AppText variant="caption" tone="muted">
                    {step.detail}
                  </AppText>
                </View>
              </View>
            ))}
          </Card>

          <Card tone="accent">
            <View style={styles.step}>
              <Icon name="lightbulb" color={colors.onPrimaryFixedVariant} />
              <View style={styles.flex}>
                <AppText variant="labelMd" style={{ color: colors.onPrimaryFixedVariant }}>
                  ¿Sabías esto?
                </AppText>
                <AppText style={{ color: colors.onPrimaryFixedVariant }}>{EXAMPLES.generatingTip}</AppText>
              </View>
            </View>
          </Card>

          <Button
            label="Ver mi plan generado"
            trailingIcon="arrowForward"
            loading={!done}
            onPress={() => router.replace("/plan")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: spacing.md },
  column: { width: "100%", maxWidth: layout.maxContentWidth, alignSelf: "center", gap: spacing.md },
  hero: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.md },
  mascot: {
    width: 104,
    height: 104,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryFixed,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { textAlign: "center" },
  step: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 40 },
  flex: { flex: 1, gap: spacing.xxs },
});
