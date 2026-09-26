import { colors, radius, spacing, touchTarget } from "@zumek/design-tokens";
import { lookup, MEAL_TYPES, type PlanMeal, type Recipe } from "@zumek/domain";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../../components/AppText";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Icon } from "../../components/Icon";
import { IconTile } from "../../components/IconTile";
import { ProgressBar } from "../../components/ProgressBar";
import { Screen } from "../../components/Screen";
import { StatusBanner } from "../../components/StatusBanner";
import { EXAMPLES } from "../../features/examples";
import { NoActivePlan } from "../../features/onboarding/NoActivePlan";
import { dayLabel, MEAL_TYPE_LABEL } from "../../lib/labels";
import { formatCents } from "../../lib/money";
import { useCatalog } from "../../state/catalog";
import { useWeek } from "../../state/week";

export default function PlanScreen() {
  const { bundle, finishWeek, syncError } = useWeek();
  const catalog = useCatalog();
  if (!bundle) return <NoActivePlan />;

  const { plan, meals } = bundle;
  const leftover = plan.budget_cents - plan.total_cost_cents;
  const days = [...new Set(meals.map((m) => m.day_index))].sort((a, b) => a - b);
  const usage = plan.budget_cents > 0 ? plan.total_cost_cents / plan.budget_cents : 0;
  const adjust = () => router.push({ pathname: "/onboarding/[step]", params: { step: "1" } });

  if (plan.status === "infeasible_likely") {
    return (
      <Screen footer={<Button label="Ajustar mis respuestas" icon="tune" onPress={adjust} />}>
        <StatusBanner status={plan.status} />
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <Button label="Ver lista de compras" icon="shoppingCart" onPress={() => router.navigate("/shopping")} />
      }
    >
      {syncError ? (
        <Card tone="danger">
          <AppText style={{ color: colors.onErrorContainer }}>{syncError}</AppText>
        </Card>
      ) : null}
      <StatusBanner status={plan.status}>
        {plan.status === "over_budget_close" ? (
          <>
            <AppText variant="labelMd" style={{ color: colors.onTertiaryFixed }}>
              Te pasas por {formatCents(-leftover)} ({((-leftover / plan.budget_cents) * 100).toFixed(1)}%)
            </AppText>
            <Button label="Ajustar presupuesto" variant="secondary" onPress={adjust} />
          </>
        ) : null}
      </StatusBanner>

      <Card>
        <View style={styles.balanceHeader}>
          <IconTile name="wallet" size={36} />
          <AppText variant="headlineSm" style={styles.flex}>
            Balance del plan semanal
          </AppText>
        </View>
        <Badge label={`${plan.people_count} personas · ${meals.length} comidas`} tone="neutral" />
        <View style={styles.metrics}>
          <Metric label="Presupuesto inicial" value={formatCents(plan.budget_cents)} />
          <Metric label="Costo total del plan" value={formatCents(plan.total_cost_cents)} />
          {leftover >= 0 ? (
            <Metric label="A tu favor" value={`+${formatCents(leftover)}`} tone="savings" />
          ) : (
            <Metric label="Excedente" value={formatCents(-leftover)} tone="warning" />
          )}
          <Metric label="Ahorro inteligente" value={formatCents(EXAMPLES.smartSavingsCents)} valueTone="savings" />
        </View>
        <View style={styles.usageLabels}>
          <AppText variant="caption" tone="muted">
            Uso de presupuesto ({(usage * 100).toFixed(1)}%)
          </AppText>
          {leftover >= 0 ? (
            <AppText variant="labelSm" tone="savings">
              {((1 - usage) * 100).toFixed(1)}% libre
            </AppText>
          ) : null}
        </View>
        <ProgressBar value={Math.min(usage, 1)} max={1} label={`Uso de presupuesto ${(usage * 100).toFixed(0)}%`} tone="savings" height={8} />
      </Card>

      <View style={styles.sectionTitle}>
        <Icon name="restaurant" color={colors.tertiary} />
        <AppText variant="headlineMd" style={styles.flex} accessibilityRole="header">
          Tu menú de la semana
        </AppText>
        <AppText variant="caption" tone="muted">
          {meals.length} platos
        </AppText>
      </View>

      {days.map((day) => (
        <View key={day} style={styles.day}>
          <AppText variant="labelMd" tone="muted" accessibilityRole="header">
            {dayLabel(day).toUpperCase()}
          </AppText>
          {meals
            .filter((m) => m.day_index === day)
            .sort((a, b) => MEAL_TYPES.indexOf(a.meal_type) - MEAL_TYPES.indexOf(b.meal_type))
            .map((meal) => (
              <MealCard key={meal.id} meal={meal} recipe={lookup(catalog.recipeById, meal.recipe_id, "Receta")} people={plan.people_count} />
            ))}
        </View>
      ))}

      <Card tone="muted">
        <AppText variant="labelMd">¿Ya terminaste esta semana?</AppText>
        <AppText variant="caption" tone="muted">
          Guardamos en tu despensa lo que sobró de cada paquete para usarlo primero en tu siguiente plan.
        </AppText>
        <Button
          label="Terminé esta semana"
          variant="secondary"
          icon="checkCircle"
          onPress={() => {
            finishWeek();
            router.replace("/pantry");
          }}
        />
      </Card>
    </Screen>
  );
}

function Metric({
  label,
  value,
  tone,
  valueTone,
}: {
  label: string;
  value: string;
  tone?: "savings" | "warning";
  valueTone?: "savings";
}) {
  const bg = tone === "savings" ? colors.secondaryContainer : tone === "warning" ? colors.tertiaryFixed : colors.surfaceContainerLow;
  const fg = tone === "savings" ? colors.onSecondaryContainer : tone === "warning" ? colors.onTertiaryFixed : undefined;
  return (
    <View style={[styles.metric, { backgroundColor: bg }]}>
      <AppText variant="caption" tone="muted" style={fg ? { color: fg } : null}>
        {label}
      </AppText>
      <AppText variant="headlineSm" tone={valueTone ?? "default"} style={fg ? { color: fg } : null}>
        {value}
      </AppText>
    </View>
  );
}

function MealCard({ meal, recipe, people }: { meal: PlanMeal; recipe: Recipe; people: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${MEAL_TYPE_LABEL[meal.meal_type]}: ${recipe.name}. Ver receta`}
      onPress={() => router.push({ pathname: "/recipe/[id]", params: { id: recipe.id } })}
      style={({ pressed }) => [styles.meal, pressed && styles.mealPressed]}
    >
      <IconTile name="restaurant" size={56} />
      <View style={styles.flex}>
        <AppText variant="headlineSm" numberOfLines={1}>
          {recipe.name}
        </AppText>
        <View style={styles.metaRow}>
          <Icon name="schedule" size={14} />
          <AppText variant="caption" tone="muted">
            {recipe.prep_time_minutes} min
          </AppText>
          <Icon name="group" size={14} />
          <AppText variant="caption" tone="muted">
            {people} personas
          </AppText>
        </View>
        <Badge label={MEAL_TYPE_LABEL[meal.meal_type]} tone="savings" />
      </View>
      <Icon name="chevronRight" color={colors.outline} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  balanceHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metric: { flexBasis: "47%", flexGrow: 1, padding: spacing.md, borderRadius: radius.control, gap: spacing.xs },
  usageLabels: { flexDirection: "row", justifyContent: "space-between" },
  sectionTitle: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  day: { gap: spacing.sm },
  meal: {
    minHeight: touchTarget.min,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surfaceContainerLowest,
  },
  mealPressed: { backgroundColor: colors.surfaceContainerLow },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
});
