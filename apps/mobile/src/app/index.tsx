import { colors, layout, spacing } from "@zumek/design-tokens";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { useOnboarding } from "../state/onboarding";
import { usePlan } from "../state/plan";

export default function Welcome() {
  const { dispatch } = useOnboarding();
  const { bundle } = usePlan();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.column}>
        <View style={styles.hero}>
          <AppText variant="title" tone="accent">
            Zumek
          </AppText>
          <AppText variant="heading">Tu súper de la semana, dentro de tu presupuesto.</AppText>
          <AppText tone="secondary">
            Dinos cuánto quieres gastar y armamos el menú y la lista de compras con precios reales de tu tienda.
          </AppText>
        </View>
        <View style={styles.actions}>
          <Button
            label="Empezar"
            onPress={() => {
              dispatch({ type: "reset" });
              router.push({ pathname: "/onboarding/[step]", params: { step: "1" } });
            }}
          />
          {bundle ? <Button label="Ver mi plan" variant="secondary" onPress={() => router.push("/plan")} /> : null}
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
  hero: { flex: 1, justifyContent: "center", gap: spacing.md },
  actions: { gap: spacing.sm },
});
