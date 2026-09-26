import type { CommercialProduct, IndexedCatalog, Recipe } from "@zumek/domain";

export interface PurchaseOption {
  product: CommercialProduct;
  priceCents: number;
}

export interface ShoppingLine {
  option: PurchaseOption;
  packages: number;
}

export interface ShoppingResult {
  lines: ShoppingLine[];
  totalCents: number;
}

// Costo "percibido" de agregar una tienda mas cuando el usuario prefiere conveniencia.
// Solo influye en que opcion se elige; nunca se suma al costo real del plan.
const STORE_PENALTY_CENTS = 3000;
const EPSILON = 1e-9;

/** Escalado lineal simple (seccion 2): quantity * people / servings_base. */
export function scaleQuantity(quantity: number, servingsBase: number, peopleCount: number): number {
  return (quantity * peopleCount) / servingsBase;
}

/**
 * Lo que usan las recetas (una por comida, pueden repetirse), escalado por personas y
 * sumado por canonical_product_id. Es la unica definicion de "cantidad usada".
 */
export function sumNeeds(recipes: Recipe[], catalog: IndexedCatalog, peopleCount: number): Map<string, number> {
  const needs = new Map<string, number>();
  for (const recipe of recipes) {
    for (const ing of catalog.ingredientsByRecipe.get(recipe.id) ?? []) {
      const qty = scaleQuantity(ing.quantity, recipe.servings_base, peopleCount);
      needs.set(ing.canonical_product_id, (needs.get(ing.canonical_product_id) ?? 0) + qty);
    }
  }
  return needs;
}

/**
 * Convierte necesidades en paquetes completos (nunca fracciones). Lo que hay en despensa
 * se descuenta primero. Por cada ingrediente elige el paquete mas barato para cubrir lo que
 * falta; con savingsWeight alto, penaliza abrir una tienda nueva.
 */
export function buildShopping(
  needs: Map<string, number>,
  options: Map<string, PurchaseOption[]>,
  pantry: Record<string, number>,
  savingsWeight: number,
): ShoppingResult {
  const lines: ShoppingLine[] = [];
  const storesUsed = new Set<string>();
  let totalCents = 0;
  const storePenalty = Math.round(savingsWeight * STORE_PENALTY_CENTS);

  for (const canonicalId of [...needs.keys()].sort()) {
    const missing = (needs.get(canonicalId) ?? 0) - (pantry[canonicalId] ?? 0);
    if (missing <= EPSILON) continue;

    let best: { line: ShoppingLine; effective: number; leftover: number } | null = null;
    for (const option of options.get(canonicalId) ?? []) {
      const packages = Math.ceil(missing / option.product.package_quantity - EPSILON);
      const cost = packages * option.priceCents;
      const effective = cost + (storesUsed.has(option.product.store_id) ? 0 : storePenalty);
      const leftover = packages * option.product.package_quantity - missing;
      if (
        !best ||
        effective < best.effective ||
        (effective === best.effective && leftover < best.leftover)
      ) {
        best = { line: { option, packages }, effective, leftover };
      }
    }
    // Sin opcion de compra: las restricciones duras ya garantizan que no pasa.
    if (!best) continue;
    lines.push(best.line);
    storesUsed.add(best.line.option.product.store_id);
    totalCents += best.line.packages * best.line.option.priceCents;
  }
  return { lines, totalCents };
}
