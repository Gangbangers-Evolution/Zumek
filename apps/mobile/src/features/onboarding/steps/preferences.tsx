import { colors, radius, spacing, touchTarget } from "@zumek/design-tokens";
import { ALLERGENS } from "@zumek/domain";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../../../components/AppText";
import { Badge } from "../../../components/Badge";
import { Card } from "../../../components/Card";
import { Chip, ChipGroup } from "../../../components/Chip";
import { Grid } from "../../../components/Grid";
import { Icon } from "../../../components/Icon";
import { capitalize } from "../../../lib/labels";
import { useCatalog } from "../../../state/catalog";
import { useOnboarding } from "../../../state/onboarding";
import { EXAMPLES } from "../../examples";

export function PreferencesStep() {
  const { state, dispatch } = useOnboarding();
  const catalog = useCatalog();
  const tags = useMemo(() => {
    const real = [...new Set(catalog.recipes.flatMap((r) => r.tags))].sort();
    return [...real, ...EXAMPLES.extraDiets.filter((d) => !real.includes(d))];
  }, [catalog]);

  return (
    <>
      <View style={styles.sectionTitle}>
        <Icon name="restaurant" color={colors.primary} />
        <AppText variant="headlineSm">Preferencias alimentarias</AppText>
      </View>
      <AppText variant="caption" tone="muted">
        Personaliza el tipo de menú sugerido cada semana.
      </AppText>
      <ChipGroup>
        {tags.map((tag) => (
          <Chip
            key={tag}
            label={capitalize(tag)}
            selected={state.tags.includes(tag)}
            onPress={() => dispatch({ type: "toggle", field: "tags", value: tag })}
          />
        ))}
      </ChipGroup>

      <View style={styles.sectionTitle}>
        <Icon name="shield" color={colors.primary} />
        <AppText variant="headlineSm" style={styles.flex}>
          Alergias e intolerancias
        </AppText>
        <Badge label="Prioridad alta" tone="brand" />
      </View>
      <AppText variant="caption" tone="muted">
        Excluimos de forma garantizada cualquier receta con estos alérgenos.
      </AppText>
      <Grid>
        {ALLERGENS.map((allergen) => {
          const selected = state.allergens.includes(allergen);
          return (
            <Pressable
              key={allergen}
              accessibilityRole="checkbox"
              accessibilityLabel={capitalize(allergen)}
              accessibilityState={{ checked: selected }}
              onPress={() => dispatch({ type: "toggle", field: "allergens", value: allergen })}
              style={[styles.allergen, selected && styles.allergenOn]}
            >
              <Icon name="warning" size={18} color={selected ? colors.onPrimaryFixedVariant : colors.tertiary} />
              <AppText variant="bodyMdMedium" style={[styles.flex, selected && { color: colors.onPrimaryFixedVariant }]}>
                {capitalize(allergen)}
              </AppText>
              <View style={[styles.box, selected && styles.boxOn]}>
                {selected ? <Icon name="check" size={14} color={colors.onPrimaryContainer} /> : null}
              </View>
            </Pressable>
          );
        })}
      </Grid>
      {state.allergens.length > 0 ? (
        <Card tone="danger">
          <AppText variant="labelMd" style={{ color: colors.onErrorContainer }}>
            Filtrado estricto activado
          </AppText>
          <AppText style={{ color: colors.onErrorContainer }}>
            Excluiremos cualquier receta que contenga {state.allergens.join(", ")}.
          </AppText>
        </Card>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  flex: { flex: 1 },
  allergen: {
    minHeight: touchTarget.button,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surfaceContainerLowest,
  },
  allergenOn: { borderColor: colors.primaryContainer, backgroundColor: colors.primaryFixed },
  box: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  boxOn: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
});
