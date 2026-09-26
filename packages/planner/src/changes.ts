// Cambios al plan que propone el chat (seccion 6, tools 2 y 3). El LLM solo elige que
// cambiar; aqui se calcula el resultado con las mismas reglas del planner, y la app lo
// aplica solo si el usuario confirma. Funciones puras, igual que generatePlan.
import type { MealType, PlanBundle } from "@zumek/domain";
import { toBundle } from "./bundle";
import {
  buildContext,
  normalize,
  preferenceScore,
  repeatCount,
  shoppingFor,
  type Choice,
  type PlannerContext,
} from "./greedy";
import { effectiveIngredients, type ShoppingResult } from "./shopping";
import type { PlannerInput, Substitutions } from "./types";

/** Las comidas del plan actual, en el orden de los slots. null si no corresponden. */
function currentChoices(ctx: PlannerContext, current: PlanBundle): Choice[] | null {
  const choices: Choice[] = [];
  for (const slot of ctx.slots) {
    const meal = current.meals.find((m) => m.day_index === slot.dayIndex && m.meal_type === slot.mealType);
    const recipe = meal && ctx.input.catalog.recipeById.get(meal.recipe_id);
    if (!recipe) return null;
    choices.push({ slot, recipe });
  }
  return choices.length === current.meals.length ? choices : null;
}

export interface MealSwap {
  dayIndex: number;
  mealType: MealType;
  excludeRecipeId: string;
}

/**
 * swap_recipe: cambia UNA comida por la mejor otra receta valida para ese slot, dejando
 * el resto del plan igual. `input` debe traer las mismas preferencias del plan actual y el
 * id del plan nuevo. null si esa comida no existe o no hay otra receta posible.
 */
export function swapMeal(input: PlannerInput, current: PlanBundle, request: MealSwap): PlanBundle | null {
  const ctx = buildContext(input);
  const choices = currentChoices(ctx, current);
  const index = choices?.findIndex((c) => c.slot.dayIndex === request.dayIndex && c.slot.mealType === request.mealType) ?? -1;
  if (!choices || index < 0) return null;
  const target = choices[index]!;
  const others = choices.filter((_, i) => i !== index);

  let best: { choices: Choice[]; shopping: ShoppingResult; score: number } | null = null;
  for (const recipe of target.slot.candidates) {
    if (recipe.id === request.excludeRecipeId || recipe.id === target.recipe.id) continue;
    const trial = choices.map((c, i) => (i === index ? { slot: c.slot, recipe } : c));
    const shopping = shoppingFor(trial, ctx);
    // Mismos criterios que el greedy: costo total (ya refleja paquetes reutilizados),
    // preferencias y no repetir.
    const score =
      -shopping.totalCents / ctx.slotBudget +
      0.5 * preferenceScore(recipe, ctx.prefs) -
      0.8 * repeatCount(recipe, target.slot, others);
    // Empate: gana el id menor (candidatas ordenadas), resultado determinista.
    if (!best || score > best.score + 1e-9) best = { choices: trial, shopping, score };
  }
  return best ? toBundle(input, best.choices, best.shopping) : null;
}

export interface IngredientSwap {
  recipeId: string;
  /** El ingrediente a cambiar: el de la receta o, si ya se cambio, el sustituto actual. */
  canonicalProductId: string;
}

export interface IngredientSwapResult {
  bundle: PlanBundle;
  substitutions: Substitutions;
  substituteId: string;
}

/**
 * swap_ingredient: busca el sustituto mas barato del mismo unit_type y categoria que no
 * rompa restricciones duras (alergenos del producto, ingredientes prohibidos, tiendas).
 * La cantidad no cambia (misma unidad base). null si no hay sustituto posible.
 */
export function swapIngredient(
  input: PlannerInput,
  current: PlanBundle,
  request: IngredientSwap,
): IngredientSwapResult | null {
  const { catalog } = input;
  const subs = input.substitutions ?? {};
  const swaps = subs[request.recipeId] ?? {};
  const ctx = buildContext(input);
  const choices = currentChoices(ctx, current);
  if (!choices?.some((c) => c.recipe.id === request.recipeId)) return null;

  // El original es la llave de la sustitucion; se acepta el id original o el del sustituto
  // actual (la base guarda la receta original, la app conoce los cambios).
  const original = (catalog.ingredientsByRecipe.get(request.recipeId) ?? []).find(
    (ing) =>
      ing.canonical_product_id === request.canonicalProductId || swaps[ing.canonical_product_id] === request.canonicalProductId,
  )?.canonical_product_id;
  const replaced = original && catalog.productById.get(swaps[original] ?? original);
  if (!original || !replaced) return null;

  const inRecipe = new Set(effectiveIngredients(catalog, request.recipeId, subs).map((i) => i.canonical_product_id));
  const allergens = new Set(ctx.prefs.allergens.map(normalize));
  const excluded = new Set(ctx.prefs.excludedProductIds);
  const candidates = catalog.canonical_products
    .filter(
      (p) =>
        p.unit_type === replaced.unit_type &&
        p.category === replaced.category &&
        !inRecipe.has(p.id) &&
        !excluded.has(p.id) &&
        !p.allergens.some((a) => allergens.has(normalize(a))) &&
        (ctx.options.has(p.id) || (ctx.prefs.pantry[p.id] ?? 0) > 0),
    )
    .sort((a, b) => a.id.localeCompare(b.id));

  let best: IngredientSwapResult | null = null;
  let bestTotal = Infinity;
  for (const product of candidates) {
    const { [original]: _previous, ...rest } = swaps;
    const recipeSwaps = product.id === original ? rest : { ...rest, [original]: product.id };
    const substitutions: Substitutions = { ...subs, [request.recipeId]: recipeSwaps };
    const trialInput = { ...input, substitutions };
    const shopping = shoppingFor(choices, { ...ctx, input: trialInput });
    if (shopping.totalCents < bestTotal) {
      bestTotal = shopping.totalCents;
      best = { bundle: toBundle(trialInput, choices, shopping), substitutions, substituteId: product.id };
    }
  }
  return best;
}
