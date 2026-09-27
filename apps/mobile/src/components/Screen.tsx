import { colors, layout, spacing } from "@zumek/design-tokens";
import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Contenedor de pantalla: fondo, scroll vertical, columna centrada de max 480px en web
 * y un pie fijo opcional para las acciones principales.
 */
export function Screen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.column}>{children}</View>
      </ScrollView>
      {footer ? (
        <View style={styles.footerBar}>
          <View style={[styles.column, styles.footer]}>{footer}</View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: spacing.md },
  column: {
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
    gap: spacing.md,
  },
  footerBar: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  footer: { gap: spacing.sm },
});
