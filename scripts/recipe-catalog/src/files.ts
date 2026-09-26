import { readFileSync } from "node:fs";
import type { CanonicalProduct, ColloquialUnit } from "./validate";

function readJson(relative: string): unknown {
  return JSON.parse(readFileSync(new URL(relative, import.meta.url), "utf8"));
}

/** Fuente unica de productos canonicos: la misma que usa el scraper de precios. */
export function loadCanonicalProducts(): CanonicalProduct[] {
  return (readJson("../../bootstrap-scraper/data/canonical-products.json") as { products: CanonicalProduct[] }).products;
}

export function loadColloquialUnits(): ColloquialUnit[] {
  return (readJson("../data/colloquial-units.json") as { units: ColloquialUnit[] }).units;
}

export function loadRecipesFile(): unknown {
  return readJson("../data/recipes.json");
}
