import { spacing } from "@zumek/design-tokens";
import { StyleSheet, View } from "react-native";
import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { useStartPlanning } from "../features/onboarding/use-start-planning";
import { formatQuantity } from "../lib/quantity";
import { useCatalog } from "../state/catalog";
import { usePantry } from "../state/pantry";
import { usePlan } from "../state/plan";

export default function PantryScreen() {
  const catalog = useCatalog();
  const { inventory } = usePantry();
  const { bundle } = usePlan();
  const startPlanning = useStartPlanning();
  const nameOf = (id: string) => catalog.canonical_products.find((p) => p.id === id)?.name ?? "Ingrediente";
  const items = [...inventory].sort((a, b) => nameOf(a.canonical_product_id).localeCompare(nameOf(b.canonical_product_id)));

  return (
    <Screen footer={bundle ? null : <Button label="Planear otra semana" onPress={startPlanning} />}>
      <AppText tone="secondary">
        Lo que te sobra de semanas anteriores. Lo usamos primero al armar tu siguiente plan.
      </AppText>
      {items.length === 0 ? (
        <Card>
          <AppText variant="label">Tu despensa está vacía</AppText>
          <AppText tone="secondary">
            Cuando termines una semana, aquí verás lo que te sobró de cada paquete.
          </AppText>
        </Card>
      ) : (
        <Card>
          {items.map((item) => (
            <View key={item.id} style={styles.row}>
              <AppText style={styles.flex}>{nameOf(item.canonical_product_id)}</AppText>
              <AppText variant="label">{formatQuantity(item.remaining_quantity, item.unit)}</AppText>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md, paddingVertical: spacing.xs },
  flex: { flex: 1 },
});
