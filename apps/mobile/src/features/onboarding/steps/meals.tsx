import { colors } from "@zumek/design-tokens";
import { MEAL_TYPES, type MealType } from "@zumek/domain";
import { AppText } from "../../../components/AppText";
import { Badge } from "../../../components/Badge";
import { Card } from "../../../components/Card";
import type { IconName } from "../../../components/Icon";
import { SelectCard } from "../../../components/SelectCard";
import { MEAL_TYPE_LABEL } from "../../../lib/labels";
import { useOnboarding } from "../../../state/onboarding";
import { EXAMPLES } from "../../examples";

const MEAL_INFO: Record<MealType, { icon: IconName; subtitle: string }> = {
  desayuno: { icon: "sunny", subtitle: "Energía para empezar el día" },
  comida: { icon: "restaurant", subtitle: "Platos nutritivos y balanceados" },
  cena: { icon: "moon", subtitle: "Opciones ligeras y fáciles de preparar" },
  snack: { icon: "cookie", subtitle: "Bocadillos económicos y saludables" },
};

export function MealsStep() {
  const { state, dispatch } = useOnboarding();
  return (
    <>
      {MEAL_TYPES.map((meal) => (
        <SelectCard
          key={meal}
          title={MEAL_TYPE_LABEL[meal]}
          subtitle={MEAL_INFO[meal].subtitle}
          icon={MEAL_INFO[meal].icon}
          selected={state.mealTypes.includes(meal)}
          onPress={() => dispatch({ type: "toggle", field: "mealTypes", value: meal })}
        >
          <Badge label={EXAMPLES.weeklyCostByMeal[meal]} tone="savings" icon="trendingDown" />
        </SelectCard>
      ))}
      <Card tone="accent">
        <AppText variant="labelSm" style={{ color: colors.onPrimaryFixedVariant }}>
          IMPACTO ESTIMADO
        </AppText>
        <AppText style={{ color: colors.onPrimaryFixedVariant }}>{EXAMPLES.mealImpact}</AppText>
      </Card>
    </>
  );
}
