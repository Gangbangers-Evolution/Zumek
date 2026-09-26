import { colors, radius, spacing, touchTarget, typography } from "@zumek/design-tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppText } from "./AppText";

export function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  format = String,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}) {
  return (
    <View style={styles.row}>
      <AppText variant="label" style={styles.label}>
        {label}
      </AppText>
      <View
        style={styles.controls}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: value, text: format(value) }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === "increment" && value < max) onChange(value + 1);
          if (e.nativeEvent.actionName === "decrement" && value > min) onChange(value - 1);
        }}
      >
        <StepButton sign="−" label={`Menos ${label.toLowerCase()}`} disabled={value <= min} onPress={() => onChange(value - 1)} />
        <AppText variant="heading" style={styles.value}>
          {format(value)}
        </AppText>
        <StepButton sign="+" label={`Más ${label.toLowerCase()}`} disabled={value >= max} onPress={() => onChange(value + 1)} />
      </View>
    </View>
  );
}

function StepButton({
  sign,
  label,
  disabled,
  onPress,
}: {
  sign: string;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled && styles.disabled]}
    >
      <Text style={styles.sign}>{sign}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  label: { flexShrink: 1 },
  controls: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  value: { minWidth: 32, textAlign: "center" },
  button: {
    width: touchTarget.min,
    height: touchTarget.min,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  disabled: { opacity: 0.4 },
  sign: { fontSize: typography.fontSize.lg, color: colors.primary, fontWeight: typography.fontWeight.bold },
});
