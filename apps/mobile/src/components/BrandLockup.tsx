import { colors } from "@zumek/design-tokens";
import { Image, StyleSheet, View } from "react-native";
import { AppText } from "./AppText";

/** La mascota y el nombre forman una sola marca, también en los encabezados. */
export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.row} accessible accessibilityLabel="Zumek, planifica y ahorra">
      <Image source={require("../../assets/images/brand/chef-logo-transparent.png")} accessible={false} resizeMode="contain" style={{ width: compact ? 46 : 62, height: compact ? 46 : 62 }} />
      <View>
        <AppText style={[styles.name, compact && styles.compact]}>Zumek<AppText style={[styles.name, styles.dot, compact && styles.compact]}>.</AppText></AppText>
        {!compact ? <AppText variant="labelSm" tone="muted" style={styles.tagline}>PLANIFICA & AHORRA</AppText> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  name: { fontFamily: "Inter_700Bold", fontSize: 30, lineHeight: 34, letterSpacing: -1.2, color: colors.onPrimaryFixedVariant },
  compact: { fontSize: 24, lineHeight: 30 },
  dot: { color: colors.onPeachText },
  tagline: { fontSize: 9, letterSpacing: 1.5, lineHeight: 16 },
});
