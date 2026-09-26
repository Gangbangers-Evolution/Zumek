import { indexCatalog, type Allergen, type IndexedCatalog, type MealType, type Recipe, type UnitType } from "@zumek/domain";
import { generatePlan, type PlannerPreferences } from "./index";

// ---------- helpers para armar catalogos chicos a la medida de cada caso ----------

export interface ProductSpec {
  id: string;
  unit: UnitType;
  packageQuantity: number;
  priceCents: number;
  store?: string;
  category?: string;
  allergens?: Allergen[];
}

export interface RecipeSpec {
  id: string;
  mealTypes?: MealType[];
  servingsBase?: number;
  allergens?: Allergen[];
  ingredients: Array<[productId: string, quantity: number]>;
}

export function catalog(products: ProductSpec[], recipes: RecipeSpec[]): IndexedCatalog {
  const unitOf = new Map(products.map((p) => [p.id, p.unit]));
  return indexCatalog({
    stores: [{ id: "s1", name: "Tienda", slug: "tienda", active: true }],
    canonical_products: products.map((p) => ({ id: p.id, name: p.id, unit_type: p.unit, category: p.category ?? "x", allergens: p.allergens ?? [] })),
    commercial_products: products.map((p) => ({
      id: `com-${p.id}`,
      canonical_product_id: p.id,
      store_id: p.store ?? "s1",
      brand: null,
      package_label: `${p.id} ${p.packageQuantity}`,
      package_quantity: p.packageQuantity,
      package_unit: p.unit,
    })),
    latest_prices: products.map((p) => ({
      id: `price-${p.id}`,
      commercial_product_id: `com-${p.id}`,
      price_cents: p.priceCents,
      observed_at: "2026-09-20T00:00:00Z",
    })),
    colloquial_units: [],
    recipes: recipes.map(
      (r): Recipe => ({
        id: r.id,
        name: r.id,
        cuisine: "Mexicana",
        meal_type: r.mealTypes ?? ["comida"],
        tags: [],
        prep_time_minutes: 20,
        servings_base: r.servingsBase ?? 2,
        allergens: r.allergens ?? [],
      }),
    ),
    recipe_steps: [],
    recipe_ingredients: recipes.flatMap((r) =>
      r.ingredients.map(([productId, quantity]) => ({
        id: `${r.id}-${productId}`,
        recipe_id: r.id,
        canonical_product_id: productId,
        quantity,
        unit: unitOf.get(productId)!,
      })),
    ),
  });
}

export function prefs(overrides: Partial<PlannerPreferences> = {}): PlannerPreferences {
  return {
    budgetCents: 100_000,
    peopleCount: 2,
    daysCount: 1,
    mealTypes: ["comida"],
    cuisines: [],
    tags: [],
    allergens: [],
    excludedProductIds: [],
    pantry: {},
    storeIds: ["s1"],
    savingsWeight: 0.5,
    ...overrides,
  };
}

export function plan(cat: IndexedCatalog, p: PlannerPreferences) {
  return generatePlan({ catalog: cat, preferences: p, planId: "p1", userId: "u1", createdAt: "2026-09-26T00:00:00Z" });
}

export function input(cat: IndexedCatalog, p: PlannerPreferences, planId = "p2") {
  return { catalog: cat, preferences: p, planId, userId: "u1", createdAt: "2026-09-26T00:00:00Z" };
}
