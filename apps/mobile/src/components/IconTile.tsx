import { colors, radius } from "@zumek/design-tokens";
import { StyleSheet, View } from "react-native";
import { Icon, type IconName } from "./Icon";

type Tone = "accent" | "savings" | "warning" | "neutral" | "danger";

const look: Record<Tone, { bg: string; fg: string }> = {
  accent: { bg: colors.primaryFixed, fg: colors.primary },
  savings: { bg: colors.secondaryContainer, fg: colors.onSecondaryContainer },
  warning: { bg: colors.tertiaryFixed, fg: colors.onTertiaryFixed },
  neutral: { bg: colors.surfaceContainer, fg: colors.onSurfaceVariant },
  danger: { bg: colors.errorContainer, fg: colors.onErrorContainer },
};

/** Icono dentro de un cuadro redondeado de color, como en las tarjetas de los mockups. */
export function IconTile({ name, tone = "accent", size = 40 }: { name: IconName; tone?: Tone; size?: number }) {
  const { bg, fg } = look[tone];
  return (
    <View style={[styles.tile, { width: size, height: size, backgroundColor: bg }]}>
      <Icon name={name} size={size * 0.55} color={fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { borderRadius: radius.control, alignItems: "center", justifyContent: "center" },
});
