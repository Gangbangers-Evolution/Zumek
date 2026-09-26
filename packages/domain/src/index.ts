// Tipos del modelo de datos (seccion 3 del Master Prompt).
// Los nombres de campo reflejan las columnas de Postgres tal cual (snake_case).
// Dinero: siempre entero en centavos MXN. Timestamps: string ISO 8601.

export type Id = string;
export type Timestamp = string;
/** Entero en centavos MXN. Nunca float. */
export type Cents = number;

export type UnitType = "mass_g" | "volume_ml" | "unit";
export type ColloquialBaseUnit = Exclude<UnitType, "unit">;
export type MealType = "desayuno" | "comida" | "cena" | "snack";
export type PlanStatus = "ok" | "over_budget_close" | "infeasible_likely";

// Catalogo de tiendas

export interface Store {
  id: Id;
  name: string;
  slug: string;
  active: boolean;
}

// Producto conceptual vs. comercial

export interface CanonicalProduct {
  id: Id;
  name: string;
  unit_type: UnitType;
  category: string;
}

export interface CommercialProduct {
  id: Id;
  canonical_product_id: Id;
  store_id: Id;
  brand: string | null;
  package_label: string;
  package_quantity: number;
  package_unit: UnitType;
}

/** INSERT-only: nunca se actualiza, cada precio nuevo es una fila nueva. */
export interface PriceObservation {
  id: Id;
  commercial_product_id: Id;
  price_cents: Cents;
  observed_at: Timestamp;
}

export interface ColloquialUnit {
  term: string;
  base_quantity: number;
  base_unit: ColloquialBaseUnit;
}

// Recetas

export interface Recipe {
  id: Id;
  name: string;
  cuisine: string;
  meal_type: MealType[];
  tags: string[];
  prep_time_minutes: number;
  servings_base: number;
  /** Restriccion DURA. */
  allergens: string[];
}

export interface RecipeStep {
  id: Id;
  recipe_id: Id;
  step_order: number;
  title: string;
  content: string;
  timer_seconds: number | null;
}

export interface RecipeIngredient {
  id: Id;
  recipe_id: Id;
  /** Siempre a canonical_product, nunca a commercial_product. */
  canonical_product_id: Id;
  quantity: number;
  unit: UnitType;
}

// Plan generado

export interface Plan {
  id: Id;
  user_id: Id;
  budget_cents: Cents;
  total_cost_cents: Cents;
  status: PlanStatus;
  people_count: number;
  days_count: number;
  stores_selected: Id[];
  /** Slider ahorro <-> conveniencia, 0.0 a 1.0. */
  savings_weight: number;
  created_at: Timestamp;
}

export interface PlanMeal {
  id: Id;
  plan_id: Id;
  /** 0-6 */
  day_index: number;
  meal_type: MealType;
  recipe_id: Id;
}

export interface PlanShoppingItem {
  id: Id;
  plan_id: Id;
  commercial_product_id: Id;
  quantity_packages: number;
  /** Copiado de price_observation, nunca una FK. */
  price_cents_snapshot: Cents;
  /** Copiado tambien, redundante a proposito. */
  store_id: Id;
}

// Despensa e inventario

export interface PantryInventory {
  id: Id;
  user_id: Id;
  canonical_product_id: Id;
  /** En unidad base. */
  remaining_quantity: number;
  unit: UnitType;
  source_plan_id: Id;
  updated_at: Timestamp;
}

// Rate limiting de IA

export interface AiCallLog {
  id: Id;
  user_id: Id;
  created_at: Timestamp;
}

export type { Catalog, PlanBundle } from "./aggregates";
