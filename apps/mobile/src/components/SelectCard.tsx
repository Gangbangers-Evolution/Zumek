import { colors, radius, spacing, touchTarget } from "@zumek/design-tokens";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "./AppText";
import { Icon, type IconName } from "./Icon";
import { IconTile } from "./IconTile";

/** Opcion grande seleccionable (comidas, cocinas, tiendas, ahorro vs conveniencia). */
export function SelectCard({
  title,
  subtitle,
  icon,
  selected,
  onPress,
  role = "checkbox",
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  selected: boolean;
  onPress: () => void;
  role?: "checkbox" | "radio";
  children?: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={title}
      accessibilityHint={subtitle}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.card, selected && styles.selected, pressed && { transform: [{ scale: 0.99 }] }]}
    >
      {icon ? <IconTile name={icon} tone={selected ? "accent" : "neutral"} /> : null}
      <View style={styles.text}>
        <AppText variant="headlineSm">{title}</AppText>
        {subtitle ? <AppText variant="caption" tone="muted">{subtitle}</AppText> : null}
        {children}
      </View>
      <View style={[styles.check, selected && styles.checkOn]}>
        {selected ? <Icon name="check" size={16} color={colors.onPrimaryContainer} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: touchTarget.min,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.divider,
    backgroundColor: colors.surfaceContainerLowest,
  },
  selected: { borderColor: colors.primaryContainer, backgroundColor: colors.primarySoft },
  text: { flex: 1, gap: spacing.xxs },
  check: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
});
