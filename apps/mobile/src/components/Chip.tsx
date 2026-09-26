import { colors, radius, spacing, touchTarget, typography } from "@zumek/design-tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "./Icon";

/** Chip seleccionable (checkbox). Seleccionado: fondo coral suave con palomita. */
export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.selected]}
    >
      {selected ? <Icon name="check" size={16} color={colors.onPrimaryFixedVariant} /> : null}
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
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
  selected: { borderColor: colors.primaryContainer, backgroundColor: colors.primaryFixed },
  text: { ...typography.bodyMdMedium, color: colors.onSurfaceVariant },
  textSelected: { ...typography.labelMd, color: colors.onPrimaryFixedVariant },
});
