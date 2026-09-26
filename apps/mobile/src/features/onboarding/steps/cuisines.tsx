import { colors, spacing } from "@zumek/design-tokens";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../../../components/AppText";
import { Card } from "../../../components/Card";
import { IconTile } from "../../../components/IconTile";
import { SelectCard } from "../../../components/SelectCard";
import { useCatalog } from "../../../state/catalog";
import { useOnboarding } from "../../../state/onboarding";
import { EXAMPLES } from "../../examples";

export function CuisinesStep() {
  const { state, dispatch } = useOnboarding();
  const catalog = useCatalog();
  const cuisines = useMemo(() => {
    const real = [...new Set(catalog.recipes.map((r) => r.cuisine))].sort().map((name) => ({ name, subtitle: undefined as string | undefined }));
    const extra = EXAMPLES.extraCuisines.filter((c) => !real.some((r) => r.name === c.name));
    return [...real, ...extra];
  }, [catalog]);

  return (
    <>
      {cuisines.map((c) => (
        <SelectCard
          key={c.name}
          title={c.name}
          subtitle={c.subtitle}
          icon="flag"
          selected={state.cuisines.includes(c.name)}
          onPress={() => dispatch({ type: "toggle", field: "cuisines", value: c.name })}
        />
      ))}
      <Card tone="accent">
        <View style={styles.tip}>
          <IconTile name="lightbulb" />
          <View style={styles.flex}>
            <AppText variant="labelMd" style={{ color: colors.onPrimaryFixedVariant }}>
              Consejo de cocina inteligente
            </AppText>
            <AppText style={{ color: colors.onPrimaryFixedVariant }}>{EXAMPLES.cuisineTip}</AppText>
          </View>
        </View>
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  tip: { flexDirection: "row", gap: spacing.md },
  flex: { flex: 1, gap: spacing.xxs },
});
