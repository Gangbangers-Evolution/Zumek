import { MEAL_TYPES, type MealType, type Recipe } from "@zumek/domain";
import { buildShopping, sumNeeds, type PurchaseOption, type ShoppingResult } from "./shopping";
import type { PlannerInput, PlannerPreferences } from "./types";

export interface Slot {
  dayIndex: number;
  mealType: MealType;
  /** Recetas que pasan las restricciones duras para este slot, ordenadas por id. */
  candidates: Recipe[];
}

/** Una comida del plan: el slot y la receta elegida para el. */
export interface Choice {
  slot: Slot;
  recipe: Recipe;
}

/** Todo lo que el greedy consulta, precalculado una vez por plan. */
export interface PlannerContext {
  input: PlannerInput;
  prefs: PlannerPreferences;
  slots: Slot[];
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
  /** Una eleccion por slot, en el orden de los slots. */
  choices: Choice[];
  shopping: ShoppingResult;
  quality: number;
}

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

export function buildContext(input: PlannerInput): PlannerContext {
  const { catalog, preferences: prefs } = input;
  const stores = new Set(prefs.storeIds);
  const allergens = new Set(prefs.allergens.map(normalize));
  const excluded = new Set(prefs.excludedProductIds);

  const options = new Map<string, PurchaseOption[]>();
  for (const product of [...catalog.commercial_products].sort((a, b) => a.id.localeCompare(b.id))) {
    const price = catalog.priceByCommercial.get(product.id);
    if (!stores.has(product.store_id) || price === undefined) continue;
    const list = options.get(product.canonical_product_id) ?? [];
    list.push({ product, priceCents: price });
    options.set(product.canonical_product_id, list);
  }

  // Restricciones DURAS: alergenos, ingredientes prohibidos y que todo se pueda conseguir
  // en las tiendas elegidas (o ya este en la despensa).
  const allowed = catalog.recipes
    .filter((recipe) => {
      if (recipe.allergens.some((a) => allergens.has(normalize(a)))) return false;
      const ingredients = catalog.ingredientsByRecipe.get(recipe.id) ?? [];
      return (
        ingredients.length > 0 &&
        ingredients.every(
          (ing) =>
            !excluded.has(ing.canonical_product_id) &&
            (options.has(ing.canonical_product_id) || (prefs.pantry[ing.canonical_product_id] ?? 0) > 0),
        )
      );
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  const slots: Slot[] = [];
  for (let day = 0; day < prefs.daysCount; day++) {
    for (const mealType of MEAL_TYPES.filter((m) => prefs.mealTypes.includes(m))) {
      slots.push({ dayIndex: day, mealType, candidates: allowed.filter((r) => r.meal_type.includes(mealType)) });
    }
  }

  return {
    input,
    prefs,
    slots,
    options,
    slotBudget: Math.max(1, prefs.budgetCents / Math.max(1, slots.length)),
  };
}

export function shoppingFor(choices: Choice[], ctx: PlannerContext): ShoppingResult {
  const needs = sumNeeds(
    choices.map((c) => c.recipe),
    ctx.input.catalog,
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

/** Cuantas veces ya se eligio la receta en otros slots; repetirla el mismo dia pesa doble. */
function repeatCount(recipe: Recipe, slot: Slot, others: Choice[]): number {
  return others
    .filter((c) => c.recipe.id === recipe.id && c.slot !== slot)
    .reduce((count, c) => count + (c.slot.dayIndex === slot.dayIndex ? 2 : 1), 0);
}

function reuseScore(recipe: Recipe, chosen: Choice[], ctx: PlannerContext): number {
  const { catalog } = ctx.input;
  const available = new Set(Object.keys(ctx.prefs.pantry).filter((id) => (ctx.prefs.pantry[id] ?? 0) > 0));
  for (const c of chosen) {
    for (const ing of catalog.ingredientsByRecipe.get(c.recipe.id) ?? []) available.add(ing.canonical_product_id);
  }
  const own = catalog.ingredientsByRecipe.get(recipe.id) ?? [];
  return own.length === 0 ? 0 : own.filter((i) => available.has(i.canonical_product_id)).length / own.length;
}

function qualityOf(choices: Choice[], ctx: PlannerContext): number {
  return choices.reduce(
    (quality, c, i) =>
      quality + preferenceScore(c.recipe, ctx.prefs) - 0.5 * repeatCount(c.recipe, c.slot, choices.slice(0, i)),
    0,
  );
}

/**
 * Pasos 2-5 de la seccion 7: llena los slots uno por uno con el mejor score compuesto.
 * Requiere que todos los slots tengan candidatas (generatePlan lo verifica antes).
 */
export function runGreedy(ctx: PlannerContext, strategy: Strategy): Attempt {
  const chosen: Choice[] = [];
  const { savingsWeight } = ctx.prefs;
  const costFactor = 1.5 - savingsWeight; // ahorro pesa mas cuanto mas cerca de 0

  for (const slot of ctx.slots) {
    const baseCost = shoppingFor(chosen, ctx).totalCents;
    let best: { recipe: Recipe; score: number } | null = null;

    for (const recipe of slot.candidates) {
      // El costo marginal ya refleja paquetes abiertos: reutilizar sale casi gratis.
      const marginal = shoppingFor([...chosen, { slot, recipe }], ctx).totalCents - baseCost;
      const score =
        -strategy.cost * costFactor * (marginal / ctx.slotBudget) +
        0.6 * strategy.reuse * reuseScore(recipe, chosen, ctx) +
        0.5 * strategy.preference * preferenceScore(recipe, ctx.prefs) -
        0.8 * strategy.repeat * repeatCount(recipe, slot, chosen) -
        0.3 * savingsWeight * (recipe.prep_time_minutes / 60);

      // Empate: gana el id menor (los candidatos ya vienen ordenados), resultado determinista.
      if (!best || score > best.score + 1e-9) best = { recipe, score };
    }
    if (!best) throw new Error(`Slot sin candidatas (dia ${slot.dayIndex}, ${slot.mealType})`);
    chosen.push({ slot, recipe: best.recipe });
  }

  return adjustToBudget(chosen, ctx, strategy.name);
}

/**
 * Paso 6: si el total se pasa del presupuesto, cambia la receta cuyo reemplazo por una
 * candidata valida baja mas el costo, hasta caber o no poder bajar mas.
 */
export function adjustToBudget(choices: Choice[], ctx: PlannerContext, strategyName: string): Attempt {
  let current = choices;
  let shopping = shoppingFor(current, ctx);
  const maxRounds = current.length * 2;

  for (let round = 0; round < maxRounds && shopping.totalCents > ctx.prefs.budgetCents; round++) {
    let best: { choices: Choice[]; shopping: ShoppingResult } | null = null;
    for (let index = 0; index < current.length; index++) {
      const choice = current[index]!;
      for (const candidate of choice.slot.candidates) {
        if (candidate.id === choice.recipe.id) continue;
        const trial = current.map((c, i) => (i === index ? { slot: c.slot, recipe: candidate } : c));
        const trialShopping = shoppingFor(trial, ctx);
        if (trialShopping.totalCents < (best?.shopping.totalCents ?? shopping.totalCents)) {
          best = { choices: trial, shopping: trialShopping };
        }
      }
    }
    if (!best) break;
    current = best.choices;
    shopping = best.shopping;
  }

  return { strategy: strategyName, choices: current, shopping, quality: qualityOf(current, ctx) };
}

/** Mejor intento: primero los que caben en presupuesto (mas calidad), si no, el mas barato. */
export function pickBest(attempts: Attempt[], budgetCents: number): Attempt {
  return [...attempts].sort((a, b) => {
    const aFits = a.shopping.totalCents <= budgetCents;
    const bFits = b.shopping.totalCents <= budgetCents;
    if (aFits !== bFits) return aFits ? -1 : 1;
    if (aFits && a.quality !== b.quality) return b.quality - a.quality;
    return a.shopping.totalCents - b.shopping.totalCents;
  })[0]!;
}
