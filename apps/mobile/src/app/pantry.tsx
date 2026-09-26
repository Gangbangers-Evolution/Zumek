import { spacing } from "@zumek/design-tokens";
import { StyleSheet, View } from "react-native";
import { AppText } from "../components/AppText";
import { ErrorState, LoadingState } from "../components/AsyncStates";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { loadPantry } from "../data/pantry-source";
import { formatQuantity } from "../lib/quantity";
import { useAsync } from "../lib/use-async";
import { useCatalog } from "../state/catalog";

export default function PantryScreen() {
  const catalog = useCatalog();
  const [state, retry] = useAsync(loadPantry, []);

  if (state.status === "loading") return <LoadingState message="Revisando tu despensa…" />;
  if (state.status === "error") return <ErrorState message="No pudimos cargar tu despensa." onRetry={retry} />;

  return (
    <Screen>
      <AppText tone="secondary">
        Lo que te sobra de semanas anteriores. Lo usamos primero al armar tu siguiente plan.
      </AppText>
      {state.data.length === 0 ? (
        <Card>
          <AppText variant="label">Tu despensa está vacía</AppText>
          <AppText tone="secondary">Cuando termines tu primer plan, aquí verás lo que te sobró.</AppText>
        </Card>
      ) : (
        <Card>
          {state.data.map((item) => (
            <View key={item.id} style={styles.row}>
              <AppText style={styles.flex}>
                {catalog.canonical_products.find((p) => p.id === item.canonical_product_id)?.name ?? "Ingrediente"}
              </AppText>
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
