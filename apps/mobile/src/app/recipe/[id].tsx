import { spacing } from "@zumek/design-tokens";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AppText } from "../../components/AppText";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Screen } from "../../components/Screen";
import { capitalize } from "../../lib/labels";
import { lookup } from "@zumek/domain";
import { scaleQuantity } from "@zumek/planner";
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
          label="Empezar a cocinar"
          onPress={() => router.push({ pathname: "/cook/[id]", params: { id: recipe.id } })}
        />
      }
    >
      <Stack.Screen options={{ title: recipe.name }} />
      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header">
          {recipe.name}
        </AppText>
        <AppText tone="secondary">
          {recipe.cuisine} · {recipe.prep_time_minutes} min · Para {people} {people === 1 ? "persona" : "personas"}
        </AppText>
        {recipe.allergens.length > 0 ? (
          <AppText variant="caption" tone="warning">
            Contiene: {recipe.allergens.map(capitalize).join(", ")}
          </AppText>
        ) : null}
      </View>

      <Card>
        <AppText variant="heading" accessibilityRole="header">
          Ingredientes
        </AppText>
        {ingredients.map((ing) => {
          const product = lookup(catalog.productById, ing.canonical_product_id, "Producto");
          const quantity = scaleQuantity(ing.quantity, recipe.servings_base, people);
          return (
            <View key={ing.id} style={styles.ingredient}>
              <AppText style={styles.flex}>{product.name}</AppText>
              <AppText tone="secondary">{formatWithColloquial(quantity, ing.unit, catalog.colloquial_units)}</AppText>
            </View>
          );
        })}
      </Card>

      <Card>
        <AppText variant="heading" accessibilityRole="header">
          Pasos
        </AppText>
        {steps.map((step) => (
          <View key={step.id} style={styles.step}>
            <AppText variant="label">
              {step.step_order}. {step.title}
            </AppText>
            <AppText tone="secondary">{step.content}</AppText>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  flex: { flex: 1 },
  ingredient: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  step: { gap: spacing.xxs },
});
