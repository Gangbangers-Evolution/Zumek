import { colors, layout, spacing } from "@zumek/design-tokens";
import { StyleSheet, View } from "react-native";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { Card } from "./Card";
import { Icon } from "./Icon";
import { IconTile } from "./IconTile";

/** Error con reintentar, como la tarjeta de "No pudimos cargar la información" del mockup. */
export function ErrorState({
  title = "Algo salió mal",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.center}>
      <Card tone="danger" style={styles.card}>
        <View style={styles.row} accessibilityRole="alert">
          <Icon name="wifiOff" size={24} color={colors.onErrorContainer} />
          <View style={styles.flex}>
            <AppText variant="labelMd" style={{ color: colors.onErrorContainer }}>
              {title}
            </AppText>
            <AppText style={{ color: colors.onErrorContainer }}>{message}</AppText>
          </View>
        </View>
        <Button label="Reintentar" icon="refresh" onPress={onRetry} />
      </Card>
    </View>
  );
}

/** Pantalla sin datos que mostrar, con una accion para salir de ahi. */
export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <View style={styles.center}>
      <IconTile name="kitchen" tone="neutral" size={64} />
      <AppText variant="headlineSm" style={styles.text}>
        {title}
      </AppText>
      <AppText tone="muted" style={styles.text}>
        {message}
      </AppText>
      <Button label={actionLabel} icon="add" onPress={onAction} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  card: { width: "100%", maxWidth: layout.maxContentWidth, gap: spacing.md },
  row: { flexDirection: "row", gap: spacing.md },
  flex: { flex: 1, gap: spacing.xxs },
  text: { textAlign: "center" },
});
