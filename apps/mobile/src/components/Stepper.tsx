import { colors, radius, spacing, touchTarget } from "@zumek/design-tokens";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "./AppText";
import { Icon } from "./Icon";

/** Contador con botones - y + (personas, dias). */
export function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  format = String,
  caption,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  caption?: string;
}) {
  return (
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
      <StepButton icon="remove" label={`Menos ${label.toLowerCase()}`} disabled={value <= min} onPress={() => onChange(value - 1)} />
      <View style={styles.value}>
        <AppText variant="headlineMd">{format(value)}</AppText>
        {caption ? <AppText variant="caption" tone="muted">{caption}</AppText> : null}
      </View>
      <StepButton icon="add" label={`Más ${label.toLowerCase()}`} disabled={value >= max} onPress={() => onChange(value + 1)} />
    </View>
  );
}

function StepButton({ icon, label, disabled, onPress }: { icon: "add" | "remove"; label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Icon name={icon} size={22} color={colors.onSurface} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.xs,
    borderRadius: radius.control,
    backgroundColor: colors.surfaceContainerLow,
  },
  value: { flex: 1, alignItems: "center" },
  button: {
    width: touchTarget.button,
    height: touchTarget.button,
    borderRadius: radius.control,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceContainerLowest,
  },
  pressed: { backgroundColor: colors.surfaceContainer },
  disabled: { opacity: 0.4 },
});
