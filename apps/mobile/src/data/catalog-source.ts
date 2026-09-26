// Fase 1: el catalogo sale de fixtures. En Fase 2 esto se reemplaza por el fetch a Supabase.
import type { Catalog } from "@zumek/domain";
import { catalogFixture } from "@zumek/domain/fixtures";
import { delay } from "./fake";

export async function loadCatalog(): Promise<Catalog> {
  await delay(600);
  return catalogFixture;
}
