// Indice del catalogo: se construye una vez al cargar y todo lo demas (planner, pantallas)
// busca por id en mapas en lugar de recorrer arreglos.
import type { Catalog } from "./aggregates";
import type {
  CanonicalProduct,
  Cents,
  CommercialProduct,
  Id,
  Recipe,
  RecipeIngredient,
  RecipeStep,
  Store,
} from "./index";

export interface IndexedCatalog extends Catalog {
  recipeById: ReadonlyMap<Id, Recipe>;
  ingredientsByRecipe: ReadonlyMap<Id, RecipeIngredient[]>;
  /** Ordenados por step_order. */
  stepsByRecipe: ReadonlyMap<Id, RecipeStep[]>;
  productById: ReadonlyMap<Id, CanonicalProduct>;
  commercialById: ReadonlyMap<Id, CommercialProduct>;
  storeById: ReadonlyMap<Id, Store>;
  /** Precio mas reciente por commercial_product_id. */
  priceByCommercial: ReadonlyMap<Id, Cents>;
}

function groupBy<T>(rows: T[], key: (row: T) => Id): Map<Id, T[]> {
  const groups = new Map<Id, T[]>();
  for (const row of rows) {
    const list = groups.get(key(row));
    if (list) list.push(row);
    else groups.set(key(row), [row]);
  }
  return groups;
}

export function indexCatalog(catalog: Catalog): IndexedCatalog {
  const steps = groupBy(catalog.recipe_steps, (s) => s.recipe_id);
  for (const list of steps.values()) list.sort((a, b) => a.step_order - b.step_order);
  return {
    ...catalog,
    recipeById: new Map(catalog.recipes.map((r) => [r.id, r])),
    ingredientsByRecipe: groupBy(catalog.recipe_ingredients, (i) => i.recipe_id),
    stepsByRecipe: steps,
    productById: new Map(catalog.canonical_products.map((p) => [p.id, p])),
    commercialById: new Map(catalog.commercial_products.map((p) => [p.id, p])),
    storeById: new Map(catalog.stores.map((s) => [s.id, s])),
    priceByCommercial: new Map(catalog.latest_prices.map((p) => [p.commercial_product_id, p.price_cents])),
  };
}

/** Busca por id cuando la referencia DEBE existir (datos del mismo catalogo); si no, es un bug. */
export function lookup<T>(map: ReadonlyMap<Id, T>, id: Id, what: string): T {
  const value = map.get(id);
  if (value === undefined) throw new Error(`${what} desconocido: ${id}`);
  return value;
}
