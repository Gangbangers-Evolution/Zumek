import { lookup, type IndexedCatalog, type PantryInventory, type PlanBundle } from "@zumek/domain";
import { sumNeeds } from "./shopping";
import type { Substitutions } from "./types";

const EPSILON = 1e-6;

function round(quantity: number): number {
  return Math.round(quantity * 1000) / 1000;
}

function unitOf(catalog: IndexedCatalog, canonicalProductId: string) {
  return lookup(catalog.productById, canonicalProductId, "Producto canonico").unit_type;
}

/**
 * Comprado menos usado por ingrediente, en unidad base (invariante 3 de la seccion 3).
 * Negativo = el plan consumio despensa que ya existia.
 */
export function planPantryDelta(
  bundle: PlanBundle,
  catalog: IndexedCatalog,
  substitutions: Substitutions = {},
): Map<string, number> {
  const used = sumNeeds(
    bundle.meals.map((meal) => lookup(catalog.recipeById, meal.recipe_id, "Receta")),
    catalog,
    bundle.plan.people_count,
    substitutions,
  );
  const delta = new Map([...used].map(([canonicalId, quantity]) => [canonicalId, -quantity]));
  for (const item of bundle.shopping_items) {
    const product = lookup(catalog.commercialById, item.commercial_product_id, "Producto de tienda");
    const id = product.canonical_product_id;
    delta.set(id, (delta.get(id) ?? 0) + item.quantity_packages * product.package_quantity);
  }
  return delta;
}

export interface PantryUpdate {
  /** Filas nuevas o actualizadas (se escriben tal cual). */
  upserts: PantryInventory[];
  /** Ids de filas que llegaron a cero y se eliminan. */
  deletes: string[];
}

export interface ClosePlanInput {
  bundle: PlanBundle;
  catalog: IndexedCatalog;
  /** Cambios de ingrediente del plan: lo usado es el sustituto, no el original. */
  substitutions?: Substitutions;
  /** Despensa actual del usuario. */
  existing: PantryInventory[];
  updatedAt: string;
  /** Id para filas nuevas; en Supabase lo genera la base. */
  newId: (canonicalProductId: string) => string;
}

/**
 * Cierra un plan contra la despensa: por ingrediente, lo que habia + comprado - usado.
 * Siempre SUMA sobre la fila existente (nunca la reemplaza); si llega a cero se elimina.
 * Si el plan uso mas de lo que compro y no habia fila, no se crea nada negativo.
 */
export function closePlanIntoPantry(input: ClosePlanInput): PantryUpdate {
  const { bundle, catalog, substitutions, existing, updatedAt, newId } = input;
  const rows = new Map(
    existing.filter((row) => row.user_id === bundle.plan.user_id).map((row) => [row.canonical_product_id, row]),
  );

  const upserts: PantryInventory[] = [];
  const deletes: string[] = [];

  for (const [canonicalId, change] of [...planPantryDelta(bundle, catalog, substitutions)].sort(([a], [b]) => a.localeCompare(b))) {
    if (Math.abs(change) <= EPSILON) continue;
    const row = rows.get(canonicalId);
    const remaining = round((row?.remaining_quantity ?? 0) + change);

    if (remaining <= EPSILON) {
      if (row) deletes.push(row.id);
      continue;
    }
    upserts.push({
      id: row?.id ?? newId(canonicalId),
      user_id: bundle.plan.user_id,
      canonical_product_id: canonicalId,
      remaining_quantity: remaining,
      unit: row?.unit ?? unitOf(catalog, canonicalId),
      source_plan_id: bundle.plan.id,
      updated_at: updatedAt,
    });
  }
  return { upserts, deletes };
}

export interface DeclarePantryInput {
  /** canonical_product_id -> cantidad que el usuario dice tener, en unidad base. */
  declared: Record<string, number>;
  existing: PantryInventory[];
  userId: string;
  catalog: IndexedCatalog;
  updatedAt: string;
  newId: (canonicalProductId: string) => string;
}

/**
 * Lo que el usuario confirma en "¿Qué tienes en casa?" es la fuente de verdad: viene
 * precargado con su despensa y puede corregirlo (se lo comio, se echo a perder). A diferencia
 * de cerrar un plan, aqui se REEMPLAZA. Las filas que no cambian conservan id, origen y fecha.
 */
export function declarePantry(input: DeclarePantryInput): PantryInventory[] {
  const { declared, existing, userId, catalog, updatedAt, newId } = input;
  const mine = new Map(existing.filter((row) => row.user_id === userId).map((row) => [row.canonical_product_id, row]));
  const declaredRows = Object.entries(declared)
    .filter(([, quantity]) => quantity > EPSILON)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([canonicalId, quantity]): PantryInventory => {
      const previous = mine.get(canonicalId);
      return {
        id: previous?.id ?? newId(canonicalId),
        user_id: userId,
        canonical_product_id: canonicalId,
        remaining_quantity: quantity,
        unit: previous?.unit ?? unitOf(catalog, canonicalId),
        source_plan_id: previous?.source_plan_id ?? null,
        updated_at: previous?.remaining_quantity === quantity ? previous.updated_at : updatedAt,
      };
    });
  return [...existing.filter((row) => row.user_id !== userId), ...declaredRows];
}

/** Aplica un PantryUpdate a una lista en memoria (la app lo usa hasta tener Supabase). */
export function applyPantryUpdate(existing: PantryInventory[], update: PantryUpdate): PantryInventory[] {
  const removed = new Set(update.deletes);
  const byId = new Map(existing.filter((row) => !removed.has(row.id)).map((row) => [row.id, row]));
  for (const row of update.upserts) byId.set(row.id, row);
  return [...byId.values()];
}
