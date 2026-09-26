import { colors, radius, spacing } from "@zumek/design-tokens";
import { lookup } from "@zumek/domain";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../../components/AppText";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { IconTile } from "../../components/IconTile";
import { Screen } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import { useStartPlanning } from "../../features/onboarding/use-start-planning";
import { formatQuantity } from "../../lib/quantity";
import { useCatalog } from "../../state/catalog";
import { useWeek } from "../../state/week";

export default function PantryScreen() {
  const catalog = useCatalog();
  const { inventory, bundle } = useWeek();
  const startPlanning = useStartPlanning();
  const [query, setQuery] = useState("");
  const nameOf = (id: string) => lookup(catalog.productById, id, "Producto").name;
  const items = [...inventory]
    .filter((row) => nameOf(row.canonical_product_id).toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => nameOf(a.canonical_product_id).localeCompare(nameOf(b.canonical_product_id)));

  return (
    <Screen footer={bundle ? null : <Button label="Planear otra semana" trailingIcon="arrowForward" onPress={startPlanning} />}>
      <View style={styles.heading}>
        <AppText variant="headlineLg" accessibilityRole="header">
          Mi despensa
        </AppText>
        <AppText tone="muted">
          Lo que te sobra de semanas anteriores. Lo usamos primero al armar tu siguiente plan.
        </AppText>
      </View>

      {inventory.length === 0 ? (
        <Card tone="muted" style={styles.empty}>
          <IconTile name="kitchen" tone="neutral" size={64} />
          <AppText variant="headlineSm">Tu despensa está vacía</AppText>
          <AppText tone="muted" style={styles.center}>
            Cuando termines una semana, aquí verás lo que te sobró de cada paquete.
          </AppText>
        </Card>
      ) : (
        <>
          <TextField label="Buscar en tu despensa" hideLabel icon="search" value={query} placeholder="Buscar arroz, leche, condimentos…" onChangeText={setQuery} />
          {items.length === 0 ? <AppText tone="muted">No hay nada con “{query}” en tu despensa.</AppText> : null}
          {items.map((item) => (
            <Card key={item.id}>
              <View style={styles.row}>
                <IconTile name="kitchen" tone="savings" />
                <AppText variant="headlineSm" style={styles.flex}>
                  {nameOf(item.canonical_product_id)}
                </AppText>
                <View style={styles.qty}>
                  <AppText variant="labelMd">{formatQuantity(item.remaining_quantity, item.unit)}</AppText>
                </View>
              </View>
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: spacing.xs },
  empty: { alignItems: "center", paddingVertical: spacing.xl },
  center: { textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  flex: { flex: 1 },
  qty: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.divider,
  },
});
