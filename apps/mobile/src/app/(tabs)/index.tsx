import { spacing } from "@zumek/design-tokens";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AppText } from "../../components/AppText";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { useStartPlanning } from "../../features/onboarding/use-start-planning";
import { EXAMPLES } from "../../features/examples";
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
          {EXAMPLES.loginComingSoon ? (
            <View style={styles.login}>
              <AppText variant="bodyMd" tone="muted">
                ¿Ya tienes cuenta? Iniciar sesión
              </AppText>
              <Badge label="Próximamente" tone="neutral" style={styles.centerSelf} />
            </View>
          ) : null}
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  centerSelf: { alignSelf: "center" },
  login: { alignItems: "center", gap: spacing.xs, paddingTop: spacing.sm },
});
