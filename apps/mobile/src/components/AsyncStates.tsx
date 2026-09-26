import { colors, spacing } from "@zumek/design-tokens";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AppText } from "./AppText";
import { Button } from "./Button";

export function LoadingState({ message }: { message: string }) {
  return (
    <View style={styles.center} accessibilityRole="progressbar" accessibilityLabel={message}>
      <ActivityIndicator size="large" color={colors.primary} />
      <AppText tone="secondary">{message}</AppText>
    </View>
  );
}

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
    <View style={styles.center} accessibilityRole="alert">
      <AppText variant="heading" style={styles.text}>
        {title}
      </AppText>
      <AppText tone="secondary" style={styles.text}>
        {message}
      </AppText>
      <Button label="Reintentar" onPress={onRetry} />
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
  text: { textAlign: "center" },
});
