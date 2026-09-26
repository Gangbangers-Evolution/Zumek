import { colors, layout, radius, spacing } from "@zumek/design-tokens";
import type { ReactNode } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "../../components/AppText";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Icon } from "../../components/Icon";
import { BrandHero } from "./BrandHero";

/** Marco de la pantalla "Carga inicial y Bienvenida": marca arriba, estado en medio, acciones abajo. */
export function StartupScreen({ children, footer }: { children?: ReactNode; footer?: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.column}>
        <BrandHero />
        <View style={styles.body}>{children}</View>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Tarjeta de "Sincronizando despensa y recetas". La carga es un solo fetch sin avance
 * medible, asi que la barra es decorativa (verde: menu, durazno: ahorro) y no finge un %.
 */
export function SyncCard() {
  return (
    <Card tone="muted" style={styles.sync}>
      <View style={styles.row} accessibilityRole="progressbar" accessibilityLabel="Sincronizando despensa y recetas">
        <ActivityIndicator size="small" color={colors.primaryContainer} />
        <AppText variant="labelSm" tone="muted" style={styles.flex}>
          Sincronizando despensa y recetas…
        </AppText>
      </View>
      <View style={styles.track}>
        <View style={[styles.segment, { flex: 2, backgroundColor: colors.primaryContainer }]} />
        <View style={[styles.segment, { flex: 1, backgroundColor: colors.peach }]} />
        <View style={{ flex: 1 }} />
      </View>
      <View style={styles.legend}>
        <Legend color={colors.primaryContainer} textColor={colors.onSurfaceVariant} label="Menú semanal" />
        <Legend color={colors.peach} textColor={colors.onPeachText} label="Ahorro estimado" />
      </View>
    </Card>
  );
}

function Legend({ color, textColor, label }: { color: string; textColor: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <AppText variant="caption" style={{ color: textColor }}>
        {label}
      </AppText>
    </View>
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
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
    padding: spacing.lg,
    gap: spacing.lg,
  },
  body: { gap: spacing.md },
  footer: { marginTop: "auto", gap: spacing.sm },
  sync: { gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  flex: { flex: 1 },
  track: {
    flexDirection: "row",
    height: 12,
    borderRadius: radius.pill,
    overflow: "hidden",
    backgroundColor: colors.primarySoft,
  },
  segment: { height: "100%" },
  legend: { flexDirection: "row", justifyContent: "space-between" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  dot: { width: 10, height: 10, borderRadius: radius.pill },
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
