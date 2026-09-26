import type { PlanBundle } from "@zumek/domain";
import { emptyBundle, toBundle } from "./bundle";
import { buildContext, pickBest, runGreedy, STRATEGIES } from "./greedy";
import type { PlannerInput } from "./types";

export type { PlannerInput, PlannerPreferences, Substitutions } from "./types";
export { swapIngredient, swapMeal, type IngredientSwap, type MealSwap } from "./changes";
export { effectiveIngredients, scaleQuantity } from "./shopping";
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
 * Arma el plan semanal. Funcion pura: recibe todos los datos ya cargados y no hace
 * llamadas de red ni lee el reloj; ids y fecha vienen en el input.
 */
export function generatePlan(input: PlannerInput): PlanBundle {
  const ctx = buildContext(input);
  // Si alguna comida pedida no tiene ninguna receta posible, ningun intento la va a cubrir.
  if (ctx.slots.length === 0 || ctx.slots.some((slot) => slot.candidates.length === 0)) return emptyBundle(input);

  const best = pickBest(
    STRATEGIES.map((strategy) => runGreedy(ctx, strategy)),
    input.preferences.budgetCents,
  );
  return toBundle(input, best.choices, best.shopping);
}
