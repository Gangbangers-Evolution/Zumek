import { colors, elevation, radius, spacing } from "@zumek/design-tokens";
import { Image, StyleSheet, View } from "react-native";
import { AppText } from "../../components/AppText";
import { Badge } from "../../components/Badge";

/** Cabecera de marca de la pantalla "Carga inicial y Bienvenida": mascota, logo y lema. */
export function BrandHero() {
  return (
    <View style={styles.hero}>
      <View style={styles.mascotHalo}>
        <Image
          source={require("../../../assets/images/mascot.png")}
          style={styles.mascot}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          accessible={false}
        />
      </View>
      <View style={styles.logoBox}>
        <Image
          source={require("../../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Zumek, planifica y ahorra"
        />
      </View>
      <AppText variant="headlineXl" accessibilityRole="header">
        Zumek
      </AppText>
      <Badge label="PLANIFICA & AHORRA" style={styles.centerSelf} />
      <AppText variant="bodyLg" tone="muted" style={styles.tagline}>
        Planifica tus comidas, cuida tu bolsillo y come delicioso cada día.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", gap: spacing.sm, paddingTop: spacing.lg },
  mascotHalo: {
    width: 104,
    height: 104,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    padding: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    ...elevation.floating,
  },
  mascot: { width: "100%", height: "100%" },
  logoBox: {
    width: "100%",
    maxWidth: 210,
    padding: spacing.sm,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: "center",
    ...elevation.card,
  },
  logo: { width: "100%", height: 48 },
  centerSelf: { alignSelf: "center" },
  tagline: { textAlign: "center", maxWidth: 340 },
});
