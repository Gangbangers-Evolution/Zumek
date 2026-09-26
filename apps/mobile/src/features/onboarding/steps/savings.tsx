import { colors, radius, spacing, touchTarget } from "@zumek/design-tokens";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../../../components/AppText";
import { Card } from "../../../components/Card";
import { Icon } from "../../../components/Icon";
import { useOnboarding } from "../../../state/onboarding";

const OPTIONS: { weight: number; label: string; hint: string }[] = [
  { weight: 0, label: "Máximo ahorro", hint: "El plan más barato, aunque vayas a más tiendas" },
  { weight: 0.25, label: "Más ahorro", hint: "Prioriza el precio" },
  { weight: 0.5, label: "Equilibrado", hint: "Un poco de todo" },
  { weight: 0.75, label: "Más conveniencia", hint: "Menos tiendas y recetas más rápidas" },
  { weight: 1, label: "Máxima conveniencia", hint: "Lo más práctico, aunque cueste un poco más" },
];

export function SavingsStep() {
  const { state, dispatch } = useOnboarding();
  const current = OPTIONS.find((o) => o.weight === state.savingsWeight) ?? OPTIONS[2]!;

  return (
    <>
      <Card>
        <View style={styles.ends}>
          <View style={styles.end}>
            <Icon name="wallet" color={colors.secondary} />
            <View>
              <AppText variant="labelMd">Más ahorro</AppText>
              <AppText variant="caption" tone="muted">
                Bolsillo primero
              </AppText>
            </View>
          </View>
          <View style={[styles.end, styles.endRight]}>
            <View>
              <AppText variant="labelMd" style={styles.right}>
                Más conveniencia
              </AppText>
              <AppText variant="caption" tone="muted" style={styles.right}>
                Listo en flash
              </AppText>
            </View>
            <Icon name="bolt" color={colors.primary} />
          </View>
        </View>

        <View accessibilityRole="radiogroup" style={styles.track}>
          <View style={styles.line} />
          {OPTIONS.map((option) => {
            const selected = option.weight === state.savingsWeight;
            return (
              <Pressable
                key={option.weight}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityHint={option.hint}
                accessibilityState={{ checked: selected }}
                onPress={() => dispatch({ type: "setSavingsWeight", weight: option.weight })}
                style={styles.stop}
              >
                <View style={[styles.dot, selected && styles.dotOn]} />
              </Pressable>
            );
          })}
        </View>
        <View style={styles.ends}>
          <AppText variant="caption" tone="muted">
            Mayor esfuerzo
          </AppText>
          <AppText variant="caption" tone="muted">
            Ultra rápido
          </AppText>
        </View>
      </Card>

      <Card tone="muted">
        <AppText variant="labelSm" tone="accent">
          MODO: {current.label.toUpperCase()}
        </AppText>
        <AppText variant="headlineSm">{current.hint}</AppText>
        <AppText tone="muted">
          Cuando dos planes cuestan parecido, este ajuste decide si pesa más el precio o el tiempo y el número de tiendas.
        </AppText>
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  ends: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  end: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexShrink: 1 },
  endRight: { justifyContent: "flex-end" },
  right: { textAlign: "right" },
  track: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  line: {
    position: "absolute",
    left: touchTarget.min / 2,
    right: touchTarget.min / 2,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceContainerHigh,
  },
  stop: { width: touchTarget.min, height: touchTarget.min, alignItems: "center", justifyContent: "center" },
  dot: {
    width: 16,
    height: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 2,
    borderColor: colors.outline,
  },
  dotOn: { width: 24, height: 24, backgroundColor: colors.primaryContainer, borderColor: colors.onPrimaryContainer },
});
