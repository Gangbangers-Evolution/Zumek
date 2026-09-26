import { colors, radius, spacing, touchTarget, typography } from "@zumek/design-tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "./Icon";

type Tone = "primary" | "money";

const selectedLook: Record<Tone, { border: string; bg: string; fg: string }> = {
  primary: { border: colors.primaryContainer, bg: colors.primaryFixed, fg: colors.onPrimaryFixedVariant },
  money: { border: colors.accent, bg: colors.accentFixed, fg: colors.onAccentFixed },
};

/** Chip seleccionable (checkbox). Seleccionado: fondo suave del tono con palomita. */
export function Chip({
  label,
  selected,
  onPress,
  tone = "primary",
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  tone?: Tone;
}) {
  const look = selectedLook[tone];
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.chip, selected && { borderColor: look.border, backgroundColor: look.bg }]}
    >
      {selected ? <Icon name="check" size={16} color={look.fg} /> : null}
      <Text style={[styles.text, selected && [styles.textSelected, { color: look.fg }]]}>{label}</Text>
    </Pressable>
  );
}

export function ChipGroup({ children }: { children: React.ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

const styles = StyleSheet.create({
  group: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    minHeight: touchTarget.min,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surfaceContainerLowest,
  },
  text: { ...typography.bodyMdMedium, color: colors.onSurfaceVariant },
  textSelected: typography.labelMd,
});
