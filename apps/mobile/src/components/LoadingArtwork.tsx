import { colors, spacing } from "@zumek/design-tokens";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import { AppText } from "./AppText";

/** El dibujo aparece solo si la espera dura; la barra de la imagen es decorativa. */
export function LoadingArtwork({ label = "Preparando todo para ti…", delayMs = 900 }: { label?: string; delayMs?: number }) {
  const [showArtwork, setShowArtwork] = useState(delayMs === 0);
  const [takingLong, setTakingLong] = useState(false);
  useEffect(() => {
    const illustration = setTimeout(() => setShowArtwork(true), delayMs);
    const hint = setTimeout(() => setTakingLong(true), 8000);
    return () => { clearTimeout(illustration); clearTimeout(hint); };
  }, [delayMs]);

  return (
    <View style={styles.container} accessibilityState={{ busy: true }}>
      {showArtwork ? <Image source={require("../../assets/images/brand/loading.png")} resizeMode="contain" style={styles.image} accessible={false} /> : null}
      <View style={styles.status}>
        <ActivityIndicator color={colors.primary} accessibilityLabel="Cargando" />
        <AppText variant="labelMd" tone="accent" style={styles.label}>{label}</AppText>
      </View>
      {takingLong ? <AppText variant="caption" tone="muted" accessibilityLiveRegion="polite" style={styles.label}>Está tardando un poco más de lo habitual. Seguimos preparando todo.</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", alignItems: "center", gap: spacing.sm },
  image: { width: "100%", maxWidth: 340, aspectRatio: 1448 / 1086 },
  status: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  label: { flexShrink: 1, textAlign: "center" },
});
