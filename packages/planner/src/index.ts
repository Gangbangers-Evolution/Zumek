import type { PlanBundle, PlanStatus } from "@zumek/domain";
import { buildContext, pickBest, runGreedy, STRATEGIES } from "./greedy";
import type { PlannerInput } from "./types";

export type { PlannerInput, PlannerPreferences } from "./types";
export { scaleQuantity } from "./shopping";
export {
  applyPantryUpdate,
  closePlanIntoPantry,
  declarePantry,
  planPantryDelta,
  type ClosePlanInput,
  type DeclarePantryInput,
  type PantryUpdate,
} from "./pantry";

/**
 * Status sobre el mejor intento (seccion 7). Un greedy no prueba imposibilidad,
 * por eso el peor caso es 'infeasible_likely' y no 'imposible'.
 */
function statusFor(totalCents: number, budgetCents: number, covered: boolean): PlanStatus {
  if (!covered) return "infeasible_likely";
  if (totalCents <= budgetCents) return "ok";
  // exceso menor al 10%, en enteros para no depender de floats
  if (totalCents * 10 < budgetCents * 11) return "over_budget_close";
  return "infeasible_likely";
}

/**
 * Arma el plan semanal. Funcion pura: recibe todos los datos ya cargados y no hace
 * llamadas de red ni lee el reloj; ids y fecha vienen en el input.
 */
export function generatePlan(input: PlannerInput): PlanBundle {
  const { preferences: prefs, planId } = input;
  const ctx = buildContext(input);
  const best = pickBest(
    STRATEGIES.map((strategy) => runGreedy(ctx, strategy)),
    prefs.budgetCents,
  );

  const covered = ctx.slots.length > 0 && best.selection.every((r) => r !== null);
  const status = statusFor(best.shopping.totalCents, prefs.budgetCents, covered);
  const viable = status !== "infeasible_likely";

  return {
    plan: {
      id: planId,
      user_id: input.userId,
      budget_cents: prefs.budgetCents,
      total_cost_cents: best.shopping.totalCents,
      status,
      people_count: prefs.peopleCount,
      days_count: prefs.daysCount,
      stores_selected: [...prefs.storeIds],
      savings_weight: prefs.savingsWeight,
      created_at: input.createdAt,
    },
    // Si no es viable no se muestra un menu a medias: la UI pide ajustar las respuestas.
    meals: viable
      ? ctx.slots.map((slot, i) => ({
          id: `${planId}-d${slot.dayIndex}-${slot.mealType}`,
          plan_id: planId,
          day_index: slot.dayIndex,
          meal_type: slot.mealType,
          recipe_id: best.selection[i]!.id,
        }))
      : [],
    shopping_items: viable
      ? best.shopping.lines.map(({ option, packages }) => ({
          id: `${planId}-${option.product.id}`,
          plan_id: planId,
          commercial_product_id: option.product.id,
          quantity_packages: packages,
          // Copia del precio, nunca FK: el plan no cambia si la tienda cambia precios.
          price_cents_snapshot: option.priceCents,
          store_id: option.product.store_id,
        }))
      : [],
  };
}
