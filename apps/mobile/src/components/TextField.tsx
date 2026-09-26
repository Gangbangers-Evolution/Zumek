import { colors, radius, spacing, touchTarget, typography } from "@zumek/design-tokens";
import { useState } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { AppText } from "./AppText";

export function TextField({
  label,
  error,
  prefix,
  ...rest
}: TextInputProps & { label: string; error?: string | null; prefix?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrapper}>
      <AppText variant="label">{label}</AppText>
      <View style={[styles.field, focused && styles.fieldFocused, error ? styles.fieldError : null]}>
        {prefix ? <AppText tone="secondary">{prefix}</AppText> : null}
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
        />
      </View>
      {error ? (
        <AppText variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: touchTarget.min + 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  // El foco se indica con el borde del contenedor (el outline nativo de web queda dentro y se ve roto)
  fieldFocused: { borderColor: colors.primary, borderWidth: 2 },
  fieldError: { borderColor: colors.danger },
  input: {
    flex: 1,
    minHeight: touchTarget.min,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
    outlineStyle: "solid",
    outlineWidth: 0,
  },
});
