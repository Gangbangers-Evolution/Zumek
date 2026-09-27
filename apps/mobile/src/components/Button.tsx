import { colors, spacing, touchTarget, typography } from "@zumek/design-tokens";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "money" | "secondary" | "savings" | "text";

const look: Record<Variant, { bg: string; pressed: string; fg: string; border?: string }> = {
  primary: { bg: colors.primaryContainer, pressed: colors.primaryContainerPressed, fg: colors.onPrimaryContainer },
  money: { bg: colors.accent, pressed: colors.accentPressed, fg: colors.onAccent },
  secondary: { bg: colors.surfaceContainerLowest, pressed: colors.surfaceContainerLow, fg: colors.onSurface, border: colors.divider },
  savings: { bg: colors.secondary, pressed: colors.onSecondaryContainer, fg: colors.onSecondary },
  text: { bg: "transparent", pressed: colors.surfaceContainer, fg: colors.onSurfaceVariant },
};

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  /** Icono despues del texto (flechas de "Continuar"). */
  trailingIcon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  trailingIcon,
  disabled = false,
  loading = false,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const inactive = disabled || loading;
  const { bg, pressed, fg, border } = look[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed: isPressed }) => [
        styles.base,
        { backgroundColor: isPressed ? pressed : bg },
        border ? { borderWidth: 1, borderColor: border } : null,
        isPressed && !inactive && styles.pressed,
        inactive && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={18} color={fg} /> : null}
          <Text style={[styles.label, { color: fg }]}>{label}</Text>
          {trailingIcon ? <Icon name={trailingIcon} size={18} color={fg} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    minWidth: touchTarget.min,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  label: { ...typography.labelMd, fontSize: 16, textAlign: "center" },
  pressed: { transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
});
