import { colors, radius, spacing } from "@zumek/design-tokens";
import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "../../components/AppText";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Icon } from "../../components/Icon";
import { LoadingArtwork } from "../../components/LoadingArtwork";
import { BrandHero } from "./BrandHero";

/** Bienvenida adaptable: marca, presentación y acciones; comparte el marco con carga y error. */
export function StartupScreen({ children, footer }: { children?: ReactNode; footer?: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.column}>
        <BrandHero>
          {children}
          {footer}
        </BrandHero>
        {footer ? (
          <View style={styles.how}>
            <View style={styles.sectionHeading}>
              <AppText variant="labelSm" tone="accent">DE LA IDEA A TU MESA</AppText>
              <AppText variant="headlineMd">Tu semana se siente más ligera.</AppText>
            </View>
            <View style={styles.benefits}>
              {[
                { number: "01", icon: "tune" as const, title: "A tu medida", text: "Cuéntanos qué te gusta y cuánto quieres gastar." },
                { number: "02", icon: "calendar" as const, title: "Todo organizado", text: "Recibe tu menú y una lista de compras por tienda." },
                { number: "03", icon: "restaurant" as const, title: "A disfrutar", text: "Cocina paso a paso y aprovecha lo que sobra." },
              ].map((item) => (
                <View key={item.number} style={styles.benefit}>
                  <View style={styles.benefitTop}><View style={styles.benefitIcon}><Icon name={item.icon} color={colors.primary} size={22} /></View><AppText variant="headlineMd" style={styles.stepNumber}>{item.number}</AppText></View>
                  <AppText variant="headlineSm">{item.title}</AppText>
                  <AppText tone="muted">{item.text}</AppText>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Estado real de carga del catálogo, sin simular porcentajes de avance. */
export function SyncCard() {
  return (
    <Card tone="muted" style={styles.sync}>
      <LoadingArtwork label="Preparando tu despensa y tus recetas…" />
    </Card>
  );
}

/** Tarjeta "No pudimos cargar la información" con Reintentar a la derecha, como en el mockup. */
export function LoadErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <Card tone="danger">
      <View style={styles.errorRow} accessibilityRole="alert">
        <View style={styles.errorIcon}>
          <Icon name="wifiOff" size={22} color={colors.error} />
        </View>
        <View style={styles.flex}>
          <AppText variant="labelMd" style={{ color: colors.onErrorContainer }}>
            No pudimos cargar la información.
          </AppText>
          <AppText style={{ color: colors.onErrorContainer }}>
            Revisa tu conexión a internet o intenta reconectar tus recetas guardadas.
          </AppText>
        </View>
      </View>
      <View style={styles.retry}>
        <Button label="Reintentar" icon="refresh" onPress={onRetry} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  column: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 1080,
    alignSelf: "center",
    padding: spacing.lg,
    gap: 40,
  },
  how: { gap: 20, paddingBottom: 12 },
  sectionHeading: { gap: 8 },
  benefits: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  benefit: { flexGrow: 1, flexBasis: 240, gap: 10, padding: 22, backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: 24 },
  benefitTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  benefitIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  stepNumber: { color: colors.outline },
  sync: { gap: spacing.sm },
  flex: { flex: 1 },
  errorRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  errorIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
  },
  retry: { alignSelf: "flex-end" },
});
