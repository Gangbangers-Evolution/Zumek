import { MEAL_TYPES, type PlanMeal } from "@zumek/domain";
import { colors, radius, spacing, touchTarget } from "@zumek/design-tokens";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { StatusBanner } from "../components/StatusBanner";
import { dayLabel, MEAL_TYPE_LABEL } from "../lib/labels";
import { formatCents } from "../lib/money";
import { useCatalog } from "../state/catalog";
import { NoActivePlan } from "../features/onboarding/NoActivePlan";
import { useWeek } from "../state/week";

export default function PlanScreen() {
  const { bundle, finishWeek } = useWeek();
  const catalog = useCatalog();
  if (!bundle) return <NoActivePlan />;

  const { plan, meals } = bundle;
  const overBy = plan.total_cost_cents - plan.budget_cents;
  const days = [...new Set(meals.map((m) => m.day_index))].sort((a, b) => a - b);
  const adjust = () => router.push({ pathname: "/onboarding/[step]", params: { step: "1" } });

  return (
    <Screen
      footer={
        plan.status === "infeasible_likely" ? (
          <Button label="Ajustar mis respuestas" onPress={adjust} />
        ) : (
          <>
            <Button label="Ver lista de compras" onPress={() => router.push("/shopping")} />
            <View style={styles.row}>
              <View style={styles.flex}>
                <Button label="Preguntar" variant="secondary" onPress={() => router.push("/chat")} />
              </View>
              <View style={styles.flex}>
                <Button label="Mi despensa" variant="secondary" onPress={() => router.push("/pantry")} />
              </View>
            </View>
          </>
        )
      }
    >
      <StatusBanner status={plan.status}>
        {plan.status === "over_budget_close" ? (
          <AppText variant="label" tone="warning">
            Te pasas por {formatCents(overBy)} ({((overBy / plan.budget_cents) * 100).toFixed(1)}%)
          </AppText>
        ) : null}
        {plan.status === "over_budget_close" ? (
          <Button label="Ajustar presupuesto" variant="secondary" onPress={adjust} />
        ) : null}
      </StatusBanner>

      {plan.status !== "infeasible_likely" ? (
        <Card>
          <View style={styles.between}>
            <AppText tone="secondary">Costo total</AppText>
            <AppText variant="heading">{formatCents(plan.total_cost_cents)}</AppText>
          </View>
          <View style={styles.between}>
            <AppText tone="secondary">Tu presupuesto</AppText>
            <AppText variant="label">{formatCents(plan.budget_cents)}</AppText>
          </View>
          {overBy < 0 ? (
            <View style={styles.between}>
              <AppText tone="secondary">Te sobra</AppText>
              <AppText variant="label" tone="success">
                {formatCents(-overBy)}
              </AppText>
            </View>
          ) : null}
          <AppText variant="caption" tone="secondary">
            {plan.people_count} personas · {plan.days_count} días · {meals.length} comidas
          </AppText>
        </Card>
      ) : null}

      {days.map((day) => (
        <View key={day} style={styles.day}>
          <AppText variant="heading" accessibilityRole="header">
            {dayLabel(day)}
          </AppText>
          {meals
            .filter((m) => m.day_index === day)
            .sort((a, b) => MEAL_TYPES.indexOf(a.meal_type) - MEAL_TYPES.indexOf(b.meal_type))
            .map((meal) => (
              <MealRow key={meal.id} meal={meal} recipeName={catalog.recipes.find((r) => r.id === meal.recipe_id)?.name ?? "Receta"} />
            ))}
        </View>
      ))}

      {plan.status !== "infeasible_likely" ? (
        <Card>
          <AppText variant="label">¿Ya terminaste esta semana?</AppText>
          <AppText variant="caption" tone="secondary">
            Guardamos en tu despensa lo que sobró de cada paquete para usarlo primero en tu siguiente plan.
          </AppText>
          <Button
            label="Terminé esta semana"
            variant="secondary"
            onPress={() => {
              finishWeek();
              router.replace("/pantry");
            }}
          />
        </Card>
      ) : null}
    </Screen>
  );
}

function MealRow({ meal, recipeName }: { meal: PlanMeal; recipeName: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${MEAL_TYPE_LABEL[meal.meal_type]}: ${recipeName}. Ver receta`}
      onPress={() => router.push({ pathname: "/recipe/[id]", params: { id: meal.recipe_id } })}
      style={({ pressed }) => [styles.meal, pressed && styles.mealPressed]}
    >
      <AppText variant="caption" tone="secondary" style={styles.mealType}>
        {MEAL_TYPE_LABEL[meal.meal_type]}
      </AppText>
      <AppText variant="label" style={styles.flex}>
        {recipeName}
      </AppText>
      <AppText tone="accent">›</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.sm },
  flex: { flex: 1 },
  between: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  day: { gap: spacing.sm },
  meal: {
    minHeight: touchTarget.min,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mealPressed: { backgroundColor: colors.primarySoft },
  mealType: { width: 72 },
});
