import type { IndexedCatalog, MealType } from "@zumek/domain";

/** Respuestas del onboarding que el planner necesita (mismos nombres que en la app). */
export interface PlannerPreferences {
  budgetCents: number;
  peopleCount: number;
  daysCount: number;
  mealTypes: MealType[];
  /** Suave: suben el score, no filtran. */
  cuisines: string[];
  /** Suave: suben el score, no filtran. */
  tags: string[];
  /** DURA: una receta con cualquiera de estos alergenos nunca entra al plan. */
  allergens: string[];
  /** DURA: canonical_product_id que nunca se usan. */
  excludedProductIds: string[];
  /** canonical_product_id -> cantidad disponible en unidad base. Se usa antes de comprar. */
  pantry: Record<string, number>;
  /** DURA: solo se compra en estas tiendas. */
  storeIds: string[];
  /** 0 = maximo ahorro, 1 = maxima conveniencia. */
  savingsWeight: number;
}

/**
 * Ingredientes cambiados por el usuario (swap_ingredient):
 * recipe_id -> canonical_product_id original -> canonical_product_id que lo reemplaza.
 * Misma cantidad en unidad base: solo se permite entre productos del mismo unit_type.
 */
export type Substitutions = Readonly<Record<string, Readonly<Record<string, string>>>>;

export interface PlannerInput {
  catalog: IndexedCatalog;
  preferences: PlannerPreferences;
  /** Opcional: sin cambios de ingrediente cada receta usa los suyos. */
  substitutions?: Substitutions;
  /** Ids y fecha los decide quien llama: el planner no tiene efectos secundarios. */
  planId: string;
  userId: string;
  createdAt: string;
}
