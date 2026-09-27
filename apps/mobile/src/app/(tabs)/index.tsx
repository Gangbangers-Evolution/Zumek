import { spacing } from "@zumek/design-tokens";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AppText } from "../../components/AppText";
import { Button } from "../../components/Button";
import { useStartPlanning } from "../../features/onboarding/use-start-planning";
import { StartupScreen } from "../../features/welcome/StartupScreen";
import { useWeek } from "../../state/week";

export default function Welcome() {
  const startPlanning = useStartPlanning();
  const { bundle } = useWeek();

  return (
    <StartupScreen
      footer={
        <>
          {bundle ? (
            <>
              <Button label="Ver mi plan" trailingIcon="arrowForward" onPress={() => router.navigate("/plan")} />
              <Button label="Planear otra semana" variant="secondary" onPress={startPlanning} />
            </>
          ) : (
            <Button label="Comenzar a planificar" trailingIcon="arrowForward" onPress={startPlanning} />
          )}
          <View style={styles.reassurance}>
            <AppText variant="caption" tone="muted">A tu gusto · A tu presupuesto · Sin complicarte</AppText>
          </View>
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  reassurance: { alignItems: "center", gap: spacing.xs, paddingTop: spacing.sm },
});
