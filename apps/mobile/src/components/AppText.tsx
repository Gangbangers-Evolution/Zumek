import { colors, typography, type TypographyVariant } from "@zumek/design-tokens";
import { Text, type TextProps } from "react-native";

type Tone = "default" | "muted" | "accent" | "savings" | "warning" | "danger" | "inverse" | "onAccent";

const toneColor: Record<Tone, string> = {
  default: colors.onSurface,
  muted: colors.onSurfaceVariant,
  accent: colors.primary,
  savings: colors.secondary,
  warning: colors.tertiary,
  danger: colors.error,
  inverse: colors.onPrimary,
  onAccent: colors.onPrimaryContainer,
};

export function AppText({
  variant = "bodyMd",
  tone = "default",
  style,
  ...rest
}: TextProps & { variant?: TypographyVariant; tone?: Tone }) {
  return <Text style={[typography[variant], { color: toneColor[tone] }, style]} {...rest} />;
}
