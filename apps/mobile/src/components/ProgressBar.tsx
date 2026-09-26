import { colors, radius } from "@zumek/design-tokens";
import { StyleSheet, View } from "react-native";

export function ProgressBar({
  value,
  max,
  label,
  tone = "accent",
  height = 6,
}: {
  value: number;
  max: number;
  label: string;
  tone?: "accent" | "savings";
  height?: number;
}) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <View
      style={[styles.track, { height }]}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max, now: value }}
    >
      <View
        style={[
          styles.fill,
          { width: `${ratio * 100}%`, backgroundColor: tone === "savings" ? colors.secondary : colors.primaryContainer },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: radius.pill, backgroundColor: colors.surfaceContainerHigh, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radius.pill },
});
