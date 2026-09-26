import { colors, radius, spacing, touchTarget } from "@zumek/design-tokens";
import { lookup } from "@zumek/domain";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../../../components/AppText";
import { Card } from "../../../components/Card";
import { Icon } from "../../../components/Icon";
import { TextField } from "../../../components/TextField";
import { useCatalog } from "../../../state/catalog";
import { useOnboarding } from "../../../state/onboarding";
import { useProductSearch } from "./use-product-search";

export function ExcludedStep() {
  const { state, dispatch } = useOnboarding();
  const catalog = useCatalog();
  const { query, setQuery, results } = useProductSearch();
  const toggle = (id: string) => dispatch({ type: "toggle", field: "excludedProductIds", value: id });
  const available = results.filter((p) => !state.excludedProductIds.includes(p.id));

  return (
    <>
      <TextField label="Buscar ingrediente" hideLabel icon="search" value={query} placeholder="Buscar ingrediente (ej. cebolla)" onChangeText={setQuery} />

      {state.excludedProductIds.length > 0 ? (
        <Card tone="muted">
          <AppText variant="labelSm" tone="muted">
            INGREDIENTES A EXCLUIR ({state.excludedProductIds.length})
          </AppText>
          <View style={styles.selected}>
            {state.excludedProductIds.map((id) => {
              const name = lookup(catalog.productById, id, "Producto").name;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="checkbox"
                  accessibilityLabel={name}
                  accessibilityState={{ checked: true }}
                  accessibilityHint="Toca para quitarlo de la lista"
                  onPress={() => toggle(id)}
                  style={styles.excludedChip}
                >
                  <AppText variant="labelMd" style={{ color: colors.onPrimaryFixedVariant }}>
                    {name}
                  </AppText>
                  <Icon name="close" size={16} color={colors.onPrimaryFixedVariant} />
                </Pressable>
              );
            })}
          </View>
        </Card>
      ) : null}

      <AppText variant="headlineSm">Ingredientes</AppText>
      {available.length === 0 ? (
        <AppText tone="muted">
          {results.length > 0 ? "Ya excluiste todos los ingredientes que coinciden." : `No encontramos ingredientes con “${query}”.`}
        </AppText>
      ) : (
        <Card style={styles.list}>
          {available.map((p) => (
            <Pressable
              key={p.id}
              accessibilityRole="checkbox"
              accessibilityLabel={p.name}
              accessibilityState={{ checked: false }}
              onPress={() => toggle(p.id)}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceContainerLow }]}
            >
              <AppText variant="bodyMdMedium" style={styles.flex}>
                {p.name}
              </AppText>
              <View style={styles.add}>
                <Icon name="add" size={18} color={colors.onSurfaceVariant} />
              </View>
            </Pressable>
          ))}
        </Card>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  selected: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  excludedChip: {
    minHeight: touchTarget.min,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryFixed,
  },
  list: { padding: 0, gap: 0 },
  row: {
    minHeight: touchTarget.min + 8,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  flex: { flex: 1 },
  add: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: "center",
    justifyContent: "center",
  },
});
