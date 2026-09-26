import { colors, radius, spacing, typography } from "@zumek/design-tokens";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { Icon, type IconName } from "./Icon";

type Tone = "accent" | "savings" | "warning" | "neutral";

const look: Record<Tone, { bg: string; fg: string }> = {
  accent: { bg: colors.accentFixed, fg: colors.onAccentFixed },
  savings: { bg: colors.secondaryContainer, fg: colors.onSecondaryContainer },
  warning: { bg: colors.tertiaryFixed, fg: colors.onTertiaryFixed },
  neutral: { bg: colors.surfaceContainer, fg: colors.onSurfaceVariant },
};

/** Etiqueta pequena en forma de pastilla ("Paso inicial", "Ahorro inteligente"). No es tocable. */
export function Badge({ label, tone = "accent", icon, style }: { label: string; tone?: Tone; icon?: IconName; style?: ViewStyle }) {
  const { bg, fg } = look[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      {icon ? <Icon name={icon} size={14} color={fg} /> : null}
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 1,
    borderRadius: radius.pill,
  },
  text: typography.labelSm,
});
