import { spacing } from "@zumek/design-tokens";
import { Children, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

/** Dos columnas que se ajustan al ancho (desde 360px). */
export function Grid({ children }: { children: ReactNode }) {
  return (
    <View style={styles.grid}>
      {Children.map(children, (child) => (
        <View style={styles.cell}>{child}</View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  cell: { flexBasis: "47%", flexGrow: 1 },
});
