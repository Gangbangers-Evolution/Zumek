// Fase 1: arma la lista a partir del plan en memoria con un retraso simulado.
// Los precios salen de price_cents_snapshot, nunca del precio actual (seccion 2).
import { lookup, type CommercialProduct, type IndexedCatalog, type PlanBundle, type Store } from "@zumek/domain";
import { delay } from "./fake";

export interface ShoppingRow {
  id: string;
  product: CommercialProduct;
  packages: number;
  unitPriceCents: number;
  subtotalCents: number;
}

export interface ShoppingGroup {
  store: Store;
  rows: ShoppingRow[];
  subtotalCents: number;
}

export async function loadShoppingList(bundle: PlanBundle, catalog: IndexedCatalog): Promise<ShoppingGroup[]> {
  await delay(500);
  const groups = new Map<string, ShoppingGroup>();
  for (const item of bundle.shopping_items) {
    const store = lookup(catalog.storeById, item.store_id, "Tienda");
    const product = lookup(catalog.commercialById, item.commercial_product_id, "Producto de tienda");
    const group = groups.get(store.id) ?? { store, rows: [], subtotalCents: 0 };
    const subtotalCents = item.price_cents_snapshot * item.quantity_packages;
    group.rows.push({
      id: item.id,
      product,
      packages: item.quantity_packages,
      unitPriceCents: item.price_cents_snapshot,
      subtotalCents,
    });
    group.subtotalCents += subtotalCents;
    groups.set(store.id, group);
  }
  return [...groups.values()];
}
