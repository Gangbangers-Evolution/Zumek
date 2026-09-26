import type { MealType, Recipe, RecipeIngredient } from "@zumek/domain";
import { buildShopping, sumNeeds, type PurchaseOption, type ShoppingResult } from "./shopping";
import type { PlannerInput, PlannerPreferences } from "./types";

export interface Slot {
  dayIndex: number;
  mealType: MealType;
}

/** Todo lo que el greedy consulta, precalculado una vez por plan. */
export interface PlannerContext {
  prefs: PlannerPreferences;
  slots: Slot[];
  /** Recetas que pasan las restricciones duras, por indice de slot. */
  candidates: Recipe[][];
  ingredients: Map<string, RecipeIngredient[]>;
  options: Map<string, PurchaseOption[]>;
  /** Presupuesto promedio por comida, para normalizar costos. */
  slotBudget: number;
}

export interface Strategy {
  name: string;
  cost: number;
  reuse: number;
  preference: number;
  repeat: number;
}

// Reintentos con distinto orden de prioridades (seccion 7): el greedy no prueba
// optimalidad, asi que se prueban varias heuristicas y se queda la mejor.
export const STRATEGIES: Strategy[] = [
  { name: "balance", cost: 1, reuse: 1, preference: 1, repeat: 1 },
  { name: "reutilizacion", cost: 1, reuse: 2, preference: 0.5, repeat: 1 },
  { name: "precio", cost: 2, reuse: 0.5, preference: 0.5, repeat: 0.5 },
  { name: "variedad", cost: 1, reuse: 0.5, preference: 1, repeat: 2 },
];

export interface Attempt {
  strategy: string;
  /** Receta elegida por slot; null si el slot no tiene candidatas. */
  selection: Array<Recipe | null>;
  shopping: ShoppingResult;
  quality: number;
}

const MEAL_ORDER: MealType[] = ["desayuno", "comida", "cena", "snack"];

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

export function buildContext(input: PlannerInput): PlannerContext {
  const { catalog, preferences: prefs } = input;
  const stores = new Set(prefs.storeIds);
  const allergens = new Set(prefs.allergens.map(normalize));
  const excluded = new Set(prefs.excludedProductIds);

  const latestPrice = new Map(catalog.latest_prices.map((p) => [p.commercial_product_id, p.price_cents]));
  const options = new Map<string, PurchaseOption[]>();
  for (const product of [...catalog.commercial_products].sort((a, b) => a.id.localeCompare(b.id))) {
    const price = latestPrice.get(product.id);
    if (!stores.has(product.store_id) || price === undefined) continue;
    const list = options.get(product.canonical_product_id) ?? [];
    list.push({ product, priceCents: price });
    options.set(product.canonical_product_id, list);
  }

  const ingredients = new Map<string, RecipeIngredient[]>();
  for (const ing of catalog.recipe_ingredients) {
    const list = ingredients.get(ing.recipe_id) ?? [];
    list.push(ing);
    ingredients.set(ing.recipe_id, list);
  }

  // Restricciones DURAS: alergenos, ingredientes prohibidos y que todo se pueda conseguir
  // en las tiendas elegidas (o ya este en la despensa).
  const allowed = catalog.recipes
    .filter((recipe) => {
      if (recipe.allergens.some((a) => allergens.has(normalize(a)))) return false;
      const recipeIngredients = ingredients.get(recipe.id) ?? [];
      if (recipeIngredients.length === 0) return false;
      return recipeIngredients.every(
        (ing) =>
          !excluded.has(ing.canonical_product_id) &&
          (options.has(ing.canonical_product_id) || (prefs.pantry[ing.canonical_product_id] ?? 0) > 0),
      );
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  const mealTypes = MEAL_ORDER.filter((m) => prefs.mealTypes.includes(m));
  const slots: Slot[] = [];
  for (let day = 0; day < prefs.daysCount; day++) {
    for (const mealType of mealTypes) slots.push({ dayIndex: day, mealType });
  }

  return {
    prefs,
    slots,
    candidates: slots.map((slot) => allowed.filter((r) => r.meal_type.includes(slot.mealType))),
    ingredients,
    options,
    slotBudget: Math.max(1, prefs.budgetCents / Math.max(1, slots.length)),
  };
}

export function shoppingFor(selection: Array<Recipe | null>, ctx: PlannerContext): ShoppingResult {
  const chosen = selection.filter((r): r is Recipe => r !== null);
  const needs = sumNeeds(
    chosen.map((r) => ({ servingsBase: r.servings_base, ingredients: ctx.ingredients.get(r.id) ?? [] })),
    ctx.prefs.peopleCount,
  );
  return buildShopping(needs, ctx.options, ctx.prefs.pantry, ctx.prefs.savingsWeight);
}

/** 0 a 1: que tanto coincide la receta con las cocinas y tags que el usuario marco. */
export function preferenceScore(recipe: Recipe, prefs: PlannerPreferences): number {
  const cuisines = new Set(prefs.cuisines.map(normalize));
  const tags = new Set(prefs.tags.map(normalize));
  const cuisine = cuisines.size > 0 && cuisines.has(normalize(recipe.cuisine)) ? 1 : 0;
  const tagHits = recipe.tags.filter((t) => tags.has(normalize(t))).length;
  const tag = tags.size > 0 ? Math.min(1, tagHits / tags.size) : 0;
  return (cuisine + tag) / 2;
}

function repeatCount(recipe: Recipe, selection: Array<Recipe | null>, ctx: PlannerContext, slotIndex: number): number {
  const day = ctx.slots[slotIndex]!.dayIndex;
  let count = 0;
  selection.forEach((r, i) => {
    if (r?.id !== recipe.id || i === slotIndex) return;
    count += ctx.slots[i]!.dayIndex === day ? 2 : 1; // repetir el mismo dia pesa doble
  });
  return count;
}

function reuseScore(recipe: Recipe, selection: Array<Recipe | null>, ctx: PlannerContext): number {
  const available = new Set(Object.keys(ctx.prefs.pantry).filter((id) => (ctx.prefs.pantry[id] ?? 0) > 0));
  for (const r of selection) {
    if (!r) continue;
    for (const ing of ctx.ingredients.get(r.id) ?? []) available.add(ing.canonical_product_id);
  }
  const own = ctx.ingredients.get(recipe.id) ?? [];
  return own.length === 0 ? 0 : own.filter((i) => available.has(i.canonical_product_id)).length / own.length;
}

function qualityOf(selection: Array<Recipe | null>, ctx: PlannerContext): number {
  let quality = 0;
  selection.forEach((r, i) => {
    if (!r) return;
    quality += preferenceScore(r, ctx.prefs) - 0.5 * repeatCount(r, selection.slice(0, i), ctx, i);
  });
  return quality;
}

/** Pasos 2-5 de la seccion 7: llena los slots uno por uno con el mejor score compuesto. */
export function runGreedy(ctx: PlannerContext, strategy: Strategy): Attempt {
  const selection: Array<Recipe | null> = ctx.slots.map(() => null);
  const { savingsWeight } = ctx.prefs;
  const costFactor = 1.5 - savingsWeight; // ahorro pesa mas cuanto mas cerca de 0

  ctx.slots.forEach((_, slotIndex) => {
    const baseCost = shoppingFor(selection, ctx).totalCents;
    let best: { recipe: Recipe; score: number } | null = null;

    for (const recipe of ctx.candidates[slotIndex]!) {
      selection[slotIndex] = recipe;
      // El costo marginal ya refleja paquetes abiertos: reutilizar sale casi gratis.
      const marginal = shoppingFor(selection, ctx).totalCents - baseCost;
      selection[slotIndex] = null;

      const score =
        -strategy.cost * costFactor * (marginal / ctx.slotBudget) +
        0.6 * strategy.reuse * reuseScore(recipe, selection, ctx) +
        0.5 * strategy.preference * preferenceScore(recipe, ctx.prefs) -
        0.8 * strategy.repeat * repeatCount(recipe, selection, ctx, slotIndex) -
        0.3 * savingsWeight * (recipe.prep_time_minutes / 60);

      // Empate: gana el id menor (los candidatos ya vienen ordenados), resultado determinista.
      if (!best || score > best.score + 1e-9) best = { recipe, score };
    }
    selection[slotIndex] = best?.recipe ?? null;
  });

  return adjustToBudget(selection, ctx, strategy.name);
}

/**
 * Paso 6: si el total se pasa del presupuesto, cambia la receta cuyo reemplazo por una
 * candidata valida baja mas el costo, hasta caber o no poder bajar mas.
 */
export function adjustToBudget(selection: Array<Recipe | null>, ctx: PlannerContext, strategyName: string): Attempt {
  let current = [...selection];
  let shopping = shoppingFor(current, ctx);
  const maxRounds = current.length * 2;

  for (let round = 0; round < maxRounds && shopping.totalCents > ctx.prefs.budgetCents; round++) {
    let best: { selection: Array<Recipe | null>; shopping: ShoppingResult } | null = null;
    for (let slotIndex = 0; slotIndex < current.length; slotIndex++) {
      for (const candidate of ctx.candidates[slotIndex]!) {
        if (candidate.id === current[slotIndex]?.id) continue;
        const trial = [...current];
        trial[slotIndex] = candidate;
        const trialShopping = shoppingFor(trial, ctx);
        if (
          trialShopping.totalCents < shopping.totalCents &&
          (!best || trialShopping.totalCents < best.shopping.totalCents)
        ) {
          best = { selection: trial, shopping: trialShopping };
        }
      }
    }
    if (!best) break;
    current = best.selection;
    shopping = best.shopping;
  }

  return { strategy: strategyName, selection: current, shopping, quality: qualityOf(current, ctx) };
}

/** Mejor intento: primero los que caben en presupuesto (mas calidad), si no, el mas barato. */
export function pickBest(attempts: Attempt[], budgetCents: number): Attempt {
  const covered = attempts.filter((a) => a.selection.every((r) => r !== null));
  const pool = covered.length > 0 ? covered : attempts;
  return [...pool].sort((a, b) => {
    const aFits = a.shopping.totalCents <= budgetCents;
    const bFits = b.shopping.totalCents <= budgetCents;
    if (aFits !== bFits) return aFits ? -1 : 1;
    if (aFits && a.quality !== b.quality) return b.quality - a.quality;
    return a.shopping.totalCents - b.shopping.totalCents;
  })[0]!;
}
