import { spacing } from "@zumek/design-tokens";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { AppText } from "../../components/AppText";
import { Button } from "../../components/Button";
import { ProgressBar } from "../../components/ProgressBar";
import { Screen } from "../../components/Screen";
import { ONBOARDING_STEPS } from "../../features/onboarding/steps";
import { useOnboarding } from "../../state/onboarding";

export default function OnboardingStepScreen() {
  const { step } = useLocalSearchParams<{ step: string }>();
  const { state } = useOnboarding();
  const index = Math.min(Math.max(Number(step) - 1 || 0, 0), ONBOARDING_STEPS.length - 1);
  const current = ONBOARDING_STEPS[index]!;
  const isLast = index === ONBOARDING_STEPS.length - 1;
  const valid = current.isValid(state);
  const { Component } = current;

  const next = () => {
    if (isLast) router.push("/generating");
    else router.push({ pathname: "/onboarding/[step]", params: { step: String(index + 2) } });
  };

  return (
    <Screen
      footer={
        <Button
          label={isLast ? "Generar mi plan" : "Siguiente"}
          disabled={!valid}
          onPress={next}
          accessibilityHint={valid ? undefined : "Completa este paso para continuar"}
        />
      }
    >
      <Stack.Screen options={{ title: `Paso ${index + 1} de ${ONBOARDING_STEPS.length}` }} />
      <ProgressBar current={index + 1} total={ONBOARDING_STEPS.length} />
      <View style={{ gap: spacing.xs }}>
        <AppText variant="title" accessibilityRole="header">
          {current.title}
        </AppText>
        <AppText tone="secondary">{current.subtitle}</AppText>
      </View>
      <Component />
    </Screen>
  );
}
