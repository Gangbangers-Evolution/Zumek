import { colors, radius, spacing, touchTarget, typography } from "@zumek/design-tokens";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { AppText } from "../../../components/AppText";
import { Card } from "../../../components/Card";
import { Icon } from "../../../components/Icon";
import { IconTile } from "../../../components/IconTile";
import { TextField } from "../../../components/TextField";
import { unitLabel } from "../../../lib/quantity";
import { useOnboarding } from "../../../state/onboarding";
import { useProductSearch } from "./use-product-search";

export function PantryStep() {
  const { state, dispatch } = useOnboarding();
  const { query, setQuery, results } = useProductSearch();
  const setItem = (productId: string, quantity: number | null) => dispatch({ type: "setPantryItem", productId, quantity });

  return (
    <>
      <Card tone="savings">
        <View style={styles.tip}>
          <IconTile name="eco" tone="savings" />
          <View style={styles.flex}>
            <AppText variant="labelMd" style={{ color: colors.onSecondaryContainer }}>
              Menos gasto, cero desperdicio
            </AppText>
            <AppText style={{ color: colors.onSecondaryContainer }}>
              Usamos lo que ya tienes en casa para ayudarte a ahorrar y evitar desperdicios.
            </AppText>
          </View>
        </View>
      </Card>

      <TextField label="Buscar ingrediente" hideLabel icon="search" value={query} placeholder="Escribe un ingrediente…" onChangeText={setQuery} />

      {results.length === 0 ? (
        <AppText tone="muted">No encontramos ingredientes con “{query}”.</AppText>
      ) : (
        <Card style={styles.list}>
          {results.map((p) => {
            const have = p.id in state.pantry;
            return (
              <View key={p.id} style={styles.row}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityLabel={p.name}
                  accessibilityState={{ checked: have }}
                  onPress={() => setItem(p.id, have ? null : 0)}
                  style={styles.check}
                >
                  <View style={[styles.box, have && styles.boxOn]}>
                    {have ? <Icon name="check" size={14} color={colors.onPrimaryContainer} /> : null}
                  </View>
                  <AppText variant="bodyMdMedium" style={styles.flex}>
                    {p.name}
                  </AppText>
                </Pressable>
                {have ? (
                  <View style={styles.qty}>
                    <TextInput
                      accessibilityLabel={`${p.name} (${unitLabel(p.unit_type)})`}
                      keyboardType="number-pad"
                      inputMode="numeric"
                      value={state.pantry[p.id] ? String(state.pantry[p.id]) : ""}
                      placeholder="0"
                      placeholderTextColor={colors.outline}
                      onChangeText={(value) => {
                        const n = Number(value.replace(/\D/g, ""));
                        setItem(p.id, Number.isFinite(n) ? n : 0);
                      }}
                      style={styles.qtyInput}
                    />
                    <AppText variant="caption" tone="muted">
                      {unitLabel(p.unit_type)}
                    </AppText>
                  </View>
                ) : null}
              </View>
            );
          })}
        </Card>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  tip: { flexDirection: "row", gap: spacing.md },
  flex: { flex: 1 },
  list: { padding: 0, gap: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  check: { flex: 1, minHeight: touchTarget.min + 8, flexDirection: "row", alignItems: "center", gap: spacing.md },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  boxOn: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  qty: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  qtyInput: {
    width: 72,
    minHeight: touchTarget.min,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surfaceContainerLowest,
    ...typography.bodyMdMedium,
    color: colors.onSurface,
    textAlign: "right",
    outlineStyle: "solid",
    outlineWidth: 0,
  },
});
