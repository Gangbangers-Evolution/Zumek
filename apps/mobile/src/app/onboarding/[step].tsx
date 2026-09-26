import { spacing } from "@zumek/design-tokens";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AppText } from "../../components/AppText";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { ProgressBar } from "../../components/ProgressBar";
import { Screen } from "../../components/Screen";
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
            variant={current.tone === "money" ? "money" : "primary"}
            disabled={!valid}
            onPress={next}
            accessibilityHint={valid ? undefined : "Completa este paso para continuar"}
          />
          {index > 0 ? <Button label="Atrás" variant="text" onPress={() => router.back()} /> : null}
        </>
      }
    >
      <Stack.Screen options={{ title: `Paso ${index + 1} de ${total}` }} />
      <View style={styles.progress}>
        <AppText variant="labelSm" tone="accent" style={styles.percent}>
          {percent}% completado
        </AppText>
        <ProgressBar value={index + 1} max={total} label={`Paso ${index + 1} de ${total}`} />
      </View>
      <View style={styles.heading}>
        <Badge label={current.badge.label} icon={current.badge.icon} />
        <AppText variant="headlineXl" accessibilityRole="header">
          {current.title}
        </AppText>
        <AppText variant="bodyMd" tone="muted">
          {current.subtitle}
        </AppText>
      </View>
      <Component />
    </Screen>
  );
}

const styles = StyleSheet.create({
  progress: { gap: spacing.xs },
  percent: { alignSelf: "flex-end" },
  heading: { gap: spacing.sm },
});
