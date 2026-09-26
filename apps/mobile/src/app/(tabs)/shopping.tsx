import { colors, radius, spacing, touchTarget } from "@zumek/design-tokens";
import { planPantryDelta } from "@zumek/planner";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../../components/AppText";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Icon } from "../../components/Icon";
import { IconTile } from "../../components/IconTile";
import { Screen } from "../../components/Screen";
import { EXAMPLES } from "../../features/examples";
import { NoActivePlan } from "../../features/onboarding/NoActivePlan";
import { groupShoppingByStore, type ShoppingRow } from "../../features/shopping/group-by-store";
import { formatCents } from "../../lib/money";
import { formatQuantity } from "../../lib/quantity";
import { useCatalog } from "../../state/catalog";
import { useWeek } from "../../state/week";

export default function ShoppingScreen() {
  const { bundle } = useWeek();
  const catalog = useCatalog();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  // Todo se deriva del plan en memoria: no hay nada que esperar ni que pueda fallar al cargar.
  const groups = useMemo(() => (bundle ? groupShoppingByStore(bundle, catalog) : []), [bundle, catalog]);
  const delta = useMemo(() => (bundle ? planPantryDelta(bundle, catalog) : new Map<string, number>()), [bundle, catalog]);

  if (!bundle) return <NoActivePlan />;

  const allIds = groups.flatMap((g) => g.rows.map((r) => r.id));
  const pending = allIds.filter((id) => !checked.has(id)).length;
  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Screen>
      <View style={styles.heading}>
        <Badge label="Ruta inteligente" tone="savings" icon="store" />
        <AppText variant="headlineLg" accessibilityRole="header">
          Lista de compras semanal
        </AppText>
        <AppText tone="muted">Optimizada por tienda para ahorrar tiempo y dinero.</AppText>
      </View>

      <Card>
        <View style={styles.totalRow}>
          <View style={styles.flex}>
            <AppText variant="labelSm" tone="muted">
              TOTAL ESTIMADO
            </AppText>
            <AppText variant="currencyDisplay">{formatCents(bundle.plan.total_cost_cents)}</AppText>
          </View>
          <View style={styles.savingsPill}>
            <AppText variant="labelSm" style={{ color: colors.onSecondaryContainer }}>
              Ahorro conseguido
            </AppText>
            <AppText variant="labelMd" style={{ color: colors.onSecondaryContainer }}>
              {formatCents(EXAMPLES.smartSavingsCents)}
            </AppText>
          </View>
        </View>
        <View style={styles.meta}>
          <Icon name="store" size={16} />
          <AppText variant="caption" tone="muted">
            {groups.length} {groups.length === 1 ? "tienda" : "tiendas"}
          </AppText>
          <Icon name="shoppingCart" size={16} />
          <AppText variant="caption" tone="muted">
            {pending} {pending === 1 ? "producto pendiente" : "productos pendientes"}
          </AppText>
        </View>
        <AppText variant="caption" tone="muted">
          Compras paquetes completos. Lo que sobre se guarda en tu despensa para la próxima semana.
        </AppText>
      </Card>

      <Button
        label={pending === 0 ? "Desmarcar todo" : "Marcar todos como comprados"}
        variant="secondary"
        icon="check"
        onPress={() => setChecked(pending === 0 ? new Set() : new Set(allIds))}
      />

      {groups.map((group) => (
        <Card key={group.store.id} style={styles.group}>
          <View style={styles.storeHeader}>
            <IconTile name="shoppingCart" tone="neutral" />
            <View style={styles.flex}>
              <AppText variant="headlineSm" accessibilityRole="header">
                {group.store.name}
              </AppText>
              <AppText variant="caption" tone="muted">
                {group.rows.length} {group.rows.length === 1 ? "artículo" : "artículos"}
              </AppText>
            </View>
            <View style={styles.subtotal}>
              <AppText variant="caption" tone="muted">
                Subtotal
              </AppText>
              <AppText variant="labelMd">{formatCents(group.subtotalCents)}</AppText>
            </View>
          </View>
          {group.rows.map((row) => (
            <ItemRow
              key={row.id}
              row={row}
              leftover={delta.get(row.product.canonical_product_id) ?? 0}
              checked={checked.has(row.id)}
              onToggle={() => toggle(row.id)}
            />
          ))}
        </Card>
      ))}
    </Screen>
  );
}

function ItemRow({
  row,
  leftover,
  checked,
  onToggle,
}: {
  row: ShoppingRow;
  /** Comprado menos usado en la semana; positivo = queda para la despensa. */
  leftover: number;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={`${row.packages} × ${row.product.package_label}, ${formatCents(row.subtotalCents)}`}
      onPress={onToggle}
      style={styles.item}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <Icon name="check" size={16} color={colors.onSecondary} /> : null}
      </View>
      <View style={styles.flex}>
        <AppText variant="bodyMdMedium" style={checked && styles.done}>
          {row.packages} × {row.product.package_label}
        </AppText>
        <AppText variant="caption" tone="muted">
          {formatCents(row.unitPriceCents)} c/u
        </AppText>
        {leftover > 0 ? (
          <AppText variant="caption" tone="savings">
            Te sobran {formatQuantity(leftover, row.product.package_unit)} para tu despensa
          </AppText>
        ) : null}
      </View>
      <AppText variant="labelMd">{formatCents(row.subtotalCents)}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  heading: { gap: spacing.xs },
  totalRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  savingsPill: {
    alignItems: "flex-end",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.control,
    backgroundColor: colors.secondaryContainer,
  },
  meta: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flexWrap: "wrap" },
  group: { padding: 0, gap: 0, overflow: "hidden" },
  storeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceContainerLow,
  },
  subtotal: { alignItems: "flex-end" },
  item: {
    minHeight: touchTarget.min + 12,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  boxChecked: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  done: { textDecorationLine: "line-through", color: colors.onSurfaceVariant },
});
