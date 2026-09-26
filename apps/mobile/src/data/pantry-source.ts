// Fase 1: despensa de ejemplo. En Fase 4 se calcula al cerrar el plan.
import type { PantryInventory } from "@zumek/domain";
import { pantryFixture } from "@zumek/domain/fixtures";
import { delay } from "./fake";

export async function loadPantry(): Promise<PantryInventory[]> {
  await delay(400);
  return pantryFixture;
}
