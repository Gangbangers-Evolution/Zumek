import { colors, radius, spacing, touchTarget, typography } from "@zumek/design-tokens";
import { useState } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { AppText } from "./AppText";
import { Icon, type IconName } from "./Icon";

export function TextField({
  label,
  hideLabel = false,
  error,
  prefix,
  icon,
  ...rest
}: TextInputProps & { label: string; hideLabel?: boolean; error?: string | null; prefix?: string; icon?: IconName }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrapper}>
      {hideLabel ? null : <AppText variant="labelMd">{label}</AppText>}
      <View style={[styles.field, focused && styles.fieldFocused, error ? styles.fieldError : null]}>
        {icon ? <Icon name={icon} size={20} color={colors.outline} /> : null}
        {prefix ? <AppText variant="bodyLg" tone="muted">{prefix}</AppText> : null}
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.outline}
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
    gap: spacing.sm,
    minHeight: touchTarget.button,
    paddingHorizontal: spacing.md,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surfaceContainerLowest,
  },
  // El foco se marca con borde verde salvia y halo suave (el outline nativo de web se ve roto)
  fieldFocused: { borderColor: colors.primaryContainer, boxShadow: `0 0 0 3px ${colors.primaryFixed}` },
  fieldError: { borderColor: colors.error },
  input: {
    flex: 1,
    minHeight: touchTarget.min,
    ...typography.bodyLg,
    color: colors.onSurface,
    outlineStyle: "solid",
    outlineWidth: 0,
  },
});
