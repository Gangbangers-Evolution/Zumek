import type { PlanBundle, PlanStatus } from "@zumek/domain";
import type { Choice } from "./greedy";
import type { ShoppingResult } from "./shopping";
import type { PlannerInput } from "./types";

/**
 * Status sobre el mejor intento (seccion 7). Un greedy no prueba imposibilidad,
 * por eso el peor caso es 'infeasible_likely' y no 'imposible'.
 */
export function statusFor(totalCents: number, budgetCents: number): PlanStatus {
  if (totalCents <= budgetCents) return "ok";
  // exceso menor al 10%, en enteros para no depender de floats
  if (totalCents * 10 < budgetCents * 11) return "over_budget_close";
  return "infeasible_likely";
}

/** Un plan sin comidas: ninguna combinacion cubre lo que se pidio. */
export function emptyBundle(input: PlannerInput): PlanBundle {
  return { plan: planRow(input, "infeasible_likely", 0), meals: [], shopping_items: [] };
}

/** Arma las filas del plan (seccion 3) a partir de las comidas elegidas y su compra. */
export function toBundle(input: PlannerInput, choices: Choice[], shopping: ShoppingResult): PlanBundle {
  const { planId } = input;
  const status = statusFor(shopping.totalCents, input.preferences.budgetCents);
  // Si no es viable no se muestra un menu a medias: la UI pide ajustar las respuestas.
  if (status === "infeasible_likely") return { ...emptyBundle(input), plan: planRow(input, status, shopping.totalCents) };

  return {
    plan: planRow(input, status, shopping.totalCents),
    meals: choices.map(({ slot, recipe }) => ({
      id: `${planId}-d${slot.dayIndex}-${slot.mealType}`,
      plan_id: planId,
      day_index: slot.dayIndex,
      meal_type: slot.mealType,
      recipe_id: recipe.id,
    })),
    shopping_items: shopping.lines.map(({ option, packages }) => ({
      id: `${planId}-${option.product.id}`,
      plan_id: planId,
      commercial_product_id: option.product.id,
      quantity_packages: packages,
      // Copia del precio, nunca FK: el plan no cambia si la tienda cambia precios.
      price_cents_snapshot: option.priceCents,
      store_id: option.product.store_id,
    })),
  };
}

function planRow(input: PlannerInput, status: PlanStatus, totalCents: number): PlanBundle["plan"] {
  const prefs = input.preferences;
  return {
    id: input.planId,
    user_id: input.userId,
    budget_cents: prefs.budgetCents,
    total_cost_cents: totalCents,
    status,
    people_count: prefs.peopleCount,
    days_count: prefs.daysCount,
    stores_selected: [...prefs.storeIds],
    savings_weight: prefs.savingsWeight,
    created_at: input.createdAt,
  };
}
