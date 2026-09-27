import { colors } from "@zumek/design-tokens";
import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Easing, Image, Platform, StyleSheet, View, useWindowDimensions } from "react-native";
import { AppText } from "../../components/AppText";
import { BrandLockup } from "../../components/BrandLockup";
import { Icon } from "../../components/Icon";
import { useDecorativeMotion } from "../../components/useDecorativeMotion";

function FloatingHeroArt({ children, wide }: { children: ReactNode; wide: boolean }) {
  const enabled = useDecorativeMotion();
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    float.setValue(0);
    if (!enabled) return;
    const driver = Platform.OS !== "web";
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: driver, isInteraction: false }),
      Animated.timing(float, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: driver, isInteraction: false }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [enabled, float]);

  return (
    <Animated.View
      style={[styles.art, wide && styles.artWide, { transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [3, -5] }) }] }]}
      accessible={false}
    >
      {children}
    </Animated.View>
  );
}

export function BrandHero({ children, animate = false }: { children?: ReactNode; animate?: boolean }) {
  const wide = useWindowDimensions().width >= 860;
  const artwork = (
    <>
      <View style={styles.halo} />
      <View style={styles.orbit} />
      <View style={styles.peachDot} />
      <Image source={require("../../../assets/images/brand/home.png")} style={styles.mascot} resizeMode="contain" accessible={false} />
      <View style={[styles.floatingCard, styles.topCard]}>
        <View style={styles.miniIcon}><Icon name="calendar" size={20} color={colors.primary} /></View>
        <View><AppText variant="labelMd">¿Qué comemos hoy?</AppText><AppText variant="caption" tone="muted">Tu semana, resuelta.</AppText></View>
      </View>
      <View style={[styles.floatingCard, styles.bottomCard]}>
        <View style={[styles.miniIcon, styles.peachIcon]}><Icon name="savings" size={20} color={colors.onPeachText} /></View>
        <View><AppText variant="labelMd">Cada ingrediente cuenta</AppText><AppText variant="caption" tone="muted">Más provecho, menos desperdicio.</AppText></View>
      </View>
    </>
  );
  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <BrandLockup />
        <View style={styles.headerNote}><Icon name="eco" size={16} color={colors.primary} /><AppText variant="caption" tone="accent">Hecho para tu día a día</AppText></View>
      </View>
      <View style={[styles.hero, wide && styles.heroWide]}>
        <View style={[styles.copy, wide && styles.copyWide]}>
          <View style={styles.eyebrow}><View style={styles.dot} /><AppText variant="labelSm" tone="accent" style={{ flexShrink: 1 }}>MENOS COMPLICACIONES. MÁS SABOR.</AppText></View>
          <AppText accessibilityRole="header" style={[styles.title, wide && styles.titleWide]}>Comer rico.{'\n'}Gastar menos.{'\n'}<AppText style={[styles.title, wide && styles.titleWide, styles.titleAccent]}>Así de fácil.</AppText></AppText>
          <AppText variant="bodyLg" tone="muted" style={styles.description}>Tu menú, tus compras y lo que ya tienes en casa. Todo en un solo lugar, a tu gusto y a tu presupuesto.</AppText>
          <View style={styles.actions}>{children}</View>
        </View>
        {animate ? <FloatingHeroArt wide={wide}>{artwork}</FloatingHeroArt> : <View style={[styles.art, wide && styles.artWide]} accessible={false}>{artwork}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 28 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 },
  headerNote: { flexDirection: "row", alignItems: "center", gap: 6 },
  hero: { gap: 16 },
  heroWide: { flexDirection: "row", alignItems: "center", gap: 38, paddingVertical: 24 },
  copy: { gap: 18 },
  copyWide: { flex: 1 },
  eyebrow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  title: { fontFamily: "Inter_700Bold", fontSize: 39, lineHeight: 45, letterSpacing: -1.6, color: "#203f36" },
  titleWide: { fontSize: 52, lineHeight: 58, letterSpacing: -2.2 },
  titleAccent: { color: colors.onPeachText },
  description: { maxWidth: 420, lineHeight: 26 },
  actions: { gap: 10, maxWidth: 400, width: "100%", marginTop: 4 },
  art: { height: 292, width: "100%", maxWidth: 460, alignSelf: "center", alignItems: "center", justifyContent: "center" },
  artWide: { flex: 1, height: 420 },
  halo: { width: "88%", aspectRatio: 1, maxHeight: "90%", borderRadius: 200, backgroundColor: "#e1eee4", position: "absolute" },
  orbit: { width: "96%", aspectRatio: 1, maxHeight: "98%", borderRadius: 240, borderWidth: 1, borderColor: "#d7e5da", position: "absolute", transform: [{ rotate: "-12deg" }] },
  peachDot: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#f5c6a0", position: "absolute", right: 20, top: 38 },
  mascot: { width: "86%", height: "86%" },
  floatingCard: { position: "absolute", flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fffefa", padding: 12, borderRadius: 18, borderWidth: 1, borderColor: "#e5e9df", boxShadow: "0 8px 24px rgba(38, 67, 52, 0.08)" },
  topCard: { top: 8, left: 0, transform: [{ rotate: "-3deg" }] },
  bottomCard: { bottom: 0, right: 0, transform: [{ rotate: "2deg" }] },
  miniIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  peachIcon: { backgroundColor: "#fbe8d8" },
});
