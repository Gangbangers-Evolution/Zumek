import { readFileSync } from "node:fs";
import type { UnitType } from "./parse";

export interface CanonicalSpec {
  name: string;
  unit_type: UnitType;
  category: string;
  /** Alergenos que aporta a cualquier receta que lo use (solo para validar recetas). */
  allergens: string[];
  search: string;
  require: string[];
  exclude: string[];
}

export function loadCanonicalProducts(): CanonicalSpec[] {
  const file = new URL("../data/canonical-products.json", import.meta.url);
  return (JSON.parse(readFileSync(file, "utf8")) as { products: CanonicalSpec[] }).products;
}
