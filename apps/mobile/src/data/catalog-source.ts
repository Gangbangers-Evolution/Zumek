// Hasta la Fase 2: el catalogo curado (recetas validadas + precios de ejemplo) de catalog-data. En Fase 2 esto se reemplaza por el fetch a Supabase.
import type { Catalog } from "@zumek/domain";
import { buildSampleCatalog } from "@zumek/catalog-data";
import { delay } from "./fake";

export async function loadCatalog(): Promise<Catalog> {
  await delay(600);
  return buildSampleCatalog();
}
