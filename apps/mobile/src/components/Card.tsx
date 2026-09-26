import { colors, elevation, radius, spacing } from "@zumek/design-tokens";
import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

type Tone = "default" | "muted" | "accent" | "savings" | "warning" | "danger";

const look: Record<Tone, { bg: string; border: string }> = {
  default: { bg: colors.surfaceContainerLowest, border: colors.divider },
  muted: { bg: colors.surfaceContainerLow, border: colors.surfaceContainerLow },
  accent: { bg: colors.primaryFixed, border: colors.primaryFixed },
  savings: { bg: colors.secondaryContainer, border: colors.secondaryContainer },
  warning: { bg: colors.tertiaryFixed, border: colors.tertiaryFixed },
  danger: { bg: colors.errorContainer, border: colors.errorContainer },
};

export function Card({ children, tone = "default", style }: { children: ReactNode; tone?: Tone; style?: ViewStyle }) {
  const { bg, border } = look[tone];
  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor: border }, tone === "default" && elevation.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, borderWidth: 1, padding: spacing.md, gap: spacing.sm },
});
