import { colors, spacing } from "@zumek/design-tokens";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Image, StyleSheet, View } from "react-native";
import { AppText } from "../../components/AppText";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { ProgressBar } from "../../components/ProgressBar";
import { Screen } from "../../components/Screen";
import { BudgetMascot } from "../../features/onboarding/BudgetMascot";
import { ONBOARDING_STEPS } from "../../features/onboarding/steps";
import { useOnboarding } from "../../state/onboarding";

export default function OnboardingStepScreen() {
  const { step } = useLocalSearchParams<{ step: string }>();
  const { state } = useOnboarding();
  const total = ONBOARDING_STEPS.length;
  const index = Math.min(Math.max(Number(step) - 1 || 0, 0), total - 1);
  const current = ONBOARDING_STEPS[index]!;
  const isLast = index === total - 1;
  const valid = current.isValid(state);
  const percent = Math.round(((index + 1) / total) * 100);
  const { Component } = current;

  const next = () => {
    if (isLast) router.push("/generating");
    else router.push({ pathname: "/onboarding/[step]", params: { step: String(index + 2) } });
  };

  return (
    <Screen
      footer={
        <>
          <Button
            label={isLast ? "Crear mi plan personalizado" : "Continuar"}
            trailingIcon="arrowForward"
            variant="primary"
            disabled={!valid}
            onPress={next}
            accessibilityHint={valid ? undefined : "Completa este paso para continuar"}
          />
          {index > 0 ? <Button label="Volver al paso anterior" variant="text" onPress={() => router.back()} /> : null}
        </>
      }
    >
      <Stack.Screen options={{ title: `Paso ${index + 1} de ${total}` }} />
      <View style={styles.intro}>
        <View style={styles.progress}>
          <View style={styles.progressLabels}>
            <AppText variant="labelSm" tone="accent">TU PLAN, A TU MANERA</AppText>
            <AppText variant="labelSm" tone="accent">{index + 1} / {total}</AppText>
          </View>
          <ProgressBar value={index + 1} max={total} label={`Paso ${index + 1} de ${total}`} height={8} />
        </View>
        <View style={styles.heading}>
          <View style={styles.headingText}>
            <Badge label={current.badge.label} icon={current.badge.icon} tone="brand" />
            <AppText variant="headlineXl" accessibilityRole="header">
              {current.title}
            </AppText>
          </View>
          {index === 0 ? (
            <BudgetMascot />
          ) : (
            <Image source={require("../../../assets/images/brand/chef-logo-transparent.png")} style={styles.mascot} resizeMode="contain" accessible={false} />
          )}
        </View>
        <AppText variant="bodyMd" tone="muted" style={styles.subtitle}>
          {current.subtitle}
        </AppText>
        <AppText variant="caption" tone="accent">{percent}% de tu plan completado</AppText>
      </View>
      <Component />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { backgroundColor: colors.primarySoft, borderRadius: 26, padding: spacing.lg, gap: spacing.md },
  progress: { gap: spacing.sm },
  progressLabels: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  heading: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  headingText: { flex: 1, gap: spacing.sm },
  mascot: { width: 76, height: 76 },
  subtitle: { lineHeight: 22 },
});
