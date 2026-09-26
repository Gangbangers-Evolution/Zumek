import { colors, radius } from "@zumek/design-tokens";
import { StyleSheet, View } from "react-native";

export function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityLabel={`Paso ${current} de ${total}`}
      accessibilityValue={{ min: 0, max: total, now: current }}
    >
      <View style={[styles.fill, { width: `${(current / total) * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.primary },
});
