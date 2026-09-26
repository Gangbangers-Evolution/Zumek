import { colors, radius, spacing } from "@zumek/design-tokens";
import { lookup } from "@zumek/domain";
import { scaleQuantity } from "@zumek/planner";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AppText } from "../../components/AppText";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Icon, type IconName } from "../../components/Icon";
import { Screen } from "../../components/Screen";
import { EXAMPLES } from "../../features/examples";
import { capitalize, MEAL_TYPE_LABEL } from "../../lib/labels";
import { formatWithColloquial } from "../../lib/quantity";
import { useCatalog } from "../../state/catalog";
import { useOnboarding } from "../../state/onboarding";
import { useWeek } from "../../state/week";

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const catalog = useCatalog();
  const { bundle } = useWeek();
  const { state } = useOnboarding();
  // El id viene de la URL: puede no existir, por eso get() y no lookup()
  const recipe = catalog.recipeById.get(id);

  if (!recipe) {
    return (
      <Screen>
        <AppText>No encontramos esta receta.</AppText>
      </Screen>
    );
  }

  const people = bundle?.plan.people_count ?? state.peopleCount;
  const ingredients = catalog.ingredientsByRecipe.get(recipe.id) ?? [];
  const steps = catalog.stepsByRecipe.get(recipe.id) ?? [];

  return (
    <Screen
      footer={
        <Button
          label="Empezar a cocinar (paso a paso)"
          icon="timer"
          onPress={() => router.push({ pathname: "/cook/[id]", params: { id: recipe.id } })}
        />
      }
    >
      <Stack.Screen options={{ title: "Detalle de receta" }} />
      <View style={styles.hero}>
        <Icon name="restaurant" size={64} color={colors.primary} />
        <View style={styles.heroBadges}>
          <Badge label={`${EXAMPLES.kcalPerServing} kcal`} tone="warning" />
        </View>
      </View>

      <View style={styles.header}>
        <AppText variant="headlineLg" accessibilityRole="header">
          {recipe.name}
        </AppText>
        <View style={styles.badges}>
          {recipe.meal_type.map((m) => (
            <Badge key={m} label={MEAL_TYPE_LABEL[m]} tone="neutral" icon="restaurant" />
          ))}
          {recipe.tags.map((t) => (
            <Badge key={t} label={capitalize(t)} tone="savings" />
          ))}
        </View>
        {recipe.allergens.length > 0 ? (
          <Badge label={`Contiene: ${recipe.allergens.map(capitalize).join(", ")}`} tone="warning" icon="warning" />
        ) : null}
      </View>

      <View style={styles.stats}>
        <Stat icon="timer" value={`${recipe.prep_time_minutes} min`} label="Tiempo total" />
        <Stat icon="group" value={`${people} pers.`} label="Porciones" />
        <Stat icon="restaurant" value={recipe.cuisine} label="Cocina" />
      </View>

      <Card>
        <AppText variant="headlineSm" accessibilityRole="header">
          Ingredientes
        </AppText>
        {ingredients.map((ing) => {
          const product = lookup(catalog.productById, ing.canonical_product_id, "Producto");
          const quantity = scaleQuantity(ing.quantity, recipe.servings_base, people);
          return (
            <View key={ing.id} style={styles.ingredient}>
              <Icon name="checkCircle" size={18} color={colors.secondary} />
              <AppText variant="bodyMdMedium" style={styles.flex}>
                {product.name}
              </AppText>
              <AppText tone="muted">{formatWithColloquial(quantity, ing.unit, catalog.colloquial_units)}</AppText>
            </View>
          );
        })}
      </Card>

      <View style={styles.sectionTitle}>
        <Icon name="restaurant" color={colors.primary} />
        <AppText variant="headlineMd" style={styles.flex} accessibilityRole="header">
          Instrucciones paso a paso
        </AppText>
        <AppText variant="caption" tone="muted">
          {steps.length} pasos
        </AppText>
      </View>
      {steps.map((step) => (
        <Card key={step.id} tone="muted">
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <AppText variant="labelMd" tone="inverse">
                {step.step_order}
              </AppText>
            </View>
            <View style={styles.flex}>
              <AppText variant="labelMd">{step.title}</AppText>
              <AppText tone="muted">{step.content}</AppText>
            </View>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

function Stat({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Icon name={icon} color={colors.primary} />
      <AppText variant="headlineSm" style={styles.center}>
        {value}
      </AppText>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: "center" },
  hero: {
    height: 180,
    borderRadius: radius.card,
    backgroundColor: colors.primaryFixed,
    alignItems: "center",
    justifyContent: "center",
  },
  heroBadges: { position: "absolute", right: spacing.sm, bottom: spacing.sm },
  header: { gap: spacing.sm },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  stats: { flexDirection: "row", gap: spacing.sm },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xxs,
    padding: spacing.md,
    borderRadius: radius.control,
    backgroundColor: colors.surfaceContainer,
  },
  ingredient: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 32 },
  sectionTitle: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  step: { flexDirection: "row", gap: spacing.md },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
