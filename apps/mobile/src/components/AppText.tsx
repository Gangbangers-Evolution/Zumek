import { colors, typography } from "@zumek/design-tokens";
import { StyleSheet, Text, type TextProps } from "react-native";

type Variant = "title" | "heading" | "body" | "caption" | "label";
type Tone = "primary" | "secondary" | "accent" | "success" | "warning" | "danger" | "inverse";

const toneColor: Record<Tone, string> = {
  primary: colors.textPrimary,
  secondary: colors.textSecondary,
  accent: colors.primary,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  inverse: colors.onPrimary,
};

export function AppText({
  variant = "body",
  tone = "primary",
  style,
  ...rest
}: TextProps & { variant?: Variant; tone?: Tone }) {
  return <Text style={[styles[variant], { color: toneColor[tone] }, style]} {...rest} />;
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize.xxl * typography.lineHeight.tight,
  },
  heading: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.lg * typography.lineHeight.tight,
  },
  body: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.fontSize.md * typography.lineHeight.normal,
  },
  caption: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  label: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});
