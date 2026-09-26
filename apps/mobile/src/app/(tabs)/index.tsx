import { colors, layout, radius, spacing } from "@zumek/design-tokens";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "../../components/AppText";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { Icon } from "../../components/Icon";
import { useStartPlanning } from "../../features/onboarding/use-start-planning";
import { EXAMPLES } from "../../features/examples";
import { useWeek } from "../../state/week";

export default function Welcome() {
  const startPlanning = useStartPlanning();
  const { bundle } = useWeek();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.column}>
        <View style={styles.hero}>
          <View style={styles.mascot}>
            <Icon name="restaurant" size={48} color={colors.primary} />
          </View>
          <AppText variant="headlineXl" accessibilityRole="header">
            Zumek
          </AppText>
          <Badge label="PLANIFICA & AHORRA" style={styles.centerSelf} />
          <AppText variant="bodyLg" tone="muted" style={styles.center}>
            Planifica tus comidas, cuida tu bolsillo y come delicioso cada día.
          </AppText>
        </View>
        <View style={styles.actions}>
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
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  column: {
    flex: 1,
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
    padding: spacing.lg,
    justifyContent: "space-between",
  },
  hero: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing.md },
  mascot: {
    width: 112,
    height: 112,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryFixed,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { textAlign: "center" },
  centerSelf: { alignSelf: "center" },
  actions: { gap: spacing.sm },
  login: { alignItems: "center", gap: spacing.xs, paddingTop: spacing.sm },
});
