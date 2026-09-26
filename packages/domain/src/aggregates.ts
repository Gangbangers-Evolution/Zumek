// Agregados de lectura: no son tablas, agrupan filas del modelo (seccion 3)
// en la forma en que la app las consume.
import type {
  CanonicalProduct,
  ColloquialUnit,
  CommercialProduct,
  PantryInventory,
  Plan,
  PlanMeal,
  PlanShoppingItem,
  PriceObservation,
  Recipe,
  RecipeIngredient,
  RecipeStep,
  Store,
} from "./index";

/** Dataset completo que la app carga una sola vez al abrir (seccion 5). */
export interface Catalog {
  stores: Store[];
  canonical_products: CanonicalProduct[];
  commercial_products: CommercialProduct[];
  /** Solo la observacion mas reciente por commercial_product. */
  latest_prices: PriceObservation[];
  colloquial_units: ColloquialUnit[];
  recipes: Recipe[];
  recipe_steps: RecipeStep[];
  recipe_ingredients: RecipeIngredient[];
}

/** Un plan generado con sus filas hijas. */
export interface PlanBundle {
  plan: Plan;
  meals: PlanMeal[];
  shopping_items: PlanShoppingItem[];
}

export type { PantryInventory };
