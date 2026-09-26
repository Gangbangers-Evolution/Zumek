import { colors, radius, spacing, touchTarget } from "@zumek/design-tokens";
import { Redirect } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../components/AppText";
import { ErrorState, LoadingState } from "../components/AsyncStates";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { loadShoppingList, type ShoppingRow } from "../data/shopping-source";
import { formatCents } from "../lib/money";
import { useAsync } from "../lib/use-async";
import { useCatalog } from "../state/catalog";
import { usePlan } from "../state/plan";

export default function ShoppingScreen() {
  const { bundle } = usePlan();
  const catalog = useCatalog();
  const [state, retry] = useAsync(
    () => (bundle ? loadShoppingList(bundle, catalog) : Promise.resolve([])),
    [bundle, catalog],
  );
  const [checked, setChecked] = useState<Set<string>>(new Set());

  if (!bundle) return <Redirect href="/" />;
  if (state.status === "loading") return <LoadingState message="Armando tu lista de compras…" />;
  if (state.status === "error") {
    return <ErrorState message="No pudimos cargar tu lista de compras." onRetry={retry} />;
  }

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Screen>
      <Card>
        <View style={styles.between}>
          <AppText tone="secondary">Total</AppText>
          <AppText variant="heading">{formatCents(bundle.plan.total_cost_cents)}</AppText>
        </View>
        <AppText variant="caption" tone="secondary">
          Compras paquetes completos. Lo que sobre se guarda en tu despensa para la próxima semana.
        </AppText>
      </Card>

      {state.data.map((group) => (
        <View key={group.store.id} style={styles.group}>
          <View style={styles.between}>
            <AppText variant="heading" accessibilityRole="header">
              {group.store.name}
            </AppText>
            <AppText variant="label">{formatCents(group.subtotalCents)}</AppText>
          </View>
          {group.rows.map((row) => (
            <ItemRow key={row.id} row={row} checked={checked.has(row.id)} onToggle={() => toggle(row.id)} />
          ))}
        </View>
      ))}
    </Screen>
  );
}

function ItemRow({ row, checked, onToggle }: { row: ShoppingRow; checked: boolean; onToggle: () => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={`${row.packages} × ${row.product.package_label}, ${formatCents(row.subtotalCents)}`}
      onPress={onToggle}
      style={styles.item}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <AppText tone="inverse">✓</AppText> : null}
      </View>
      <View style={styles.flex}>
        <AppText variant="label" style={checked && styles.done}>
          {row.packages} × {row.product.package_label}
        </AppText>
        <AppText variant="caption" tone="secondary">
          {formatCents(row.unitPriceCents)} c/u
        </AppText>
      </View>
      <AppText>{formatCents(row.subtotalCents)}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  group: { gap: spacing.sm },
  flex: { flex: 1 },
  item: {
    minHeight: touchTarget.min,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  boxChecked: { backgroundColor: colors.primary },
  done: { textDecorationLine: "line-through", color: colors.textSecondary },
});
