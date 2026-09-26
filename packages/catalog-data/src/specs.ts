// Cargadores tipados de los JSON curados. Cada valor cerrado (unidad, alergeno, tienda)
// se verifica al cargar: un error de captura truena aqui y no a mitad de un plan.
import {
  ALLERGENS,
  UNIT_TYPES,
  type Allergen,
  type ColloquialBaseUnit,
  type UnitType,
} from "@zumek/domain";
import canonicalJson from "../data/canonical-products.json";
import colloquialJson from "../data/colloquial-units.json";
import recipesJson from "../data/recipes.json";
import pricesJson from "../data/sample-prices.json";
import storesJson from "../data/stores.json";

export interface CanonicalProductSpec {
  name: string;
  unit_type: UnitType;
  category: string;
  /** Alergenos que aporta a cualquier receta que lo use (el validador de recetas lo exige). */
  allergens: Allergen[];
  /** Busqueda y filtros del scraper de precios. */
  search: string;
  require: string[];
  exclude: string[];
}

export interface StoreSpec {
  slug: string;
  name: string;
}

export interface ColloquialUnitSpec {
  term: string;
  base_quantity: number;
  base_unit: ColloquialBaseUnit;
}

export interface SamplePriceSpec {
  store: string;
  product: string;
  brand: string | null;
  package_label: string;
  package_quantity: number;
  price_cents: number;
}

function isOneOf<T extends string>(values: readonly T[], value: string): value is T {
  return (values as readonly string[]).includes(value);
}

function oneOf<T extends string>(values: readonly T[], value: string, where: string): T {
  if (!isOneOf(values, value)) throw new Error(`${where}: "${value}" no es valido (usa: ${values.join(", ")})`);
  return value;
}

export const CANONICAL_PRODUCTS: CanonicalProductSpec[] = canonicalJson.products.map((p) => ({
  ...p,
  unit_type: oneOf(UNIT_TYPES, p.unit_type, `canonical-products.json "${p.name}"`),
  allergens: p.allergens.map((a: string) => oneOf(ALLERGENS, a, `canonical-products.json "${p.name}"`)),
}));

export const STORES: StoreSpec[] = storesJson.stores;

export const COLLOQUIAL_UNITS: ColloquialUnitSpec[] = colloquialJson.units.map((u) => ({
  ...u,
  base_unit: oneOf(["mass_g", "volume_ml"] as const, u.base_unit, `colloquial-units.json "${u.term}"`),
}));

export const SAMPLE_PRICES: SamplePriceSpec[] = pricesJson.prices;

/** Sin tipar a proposito: lo escribe una persona y validateRecipes decide si es valido. */
export const RECIPES_FILE: unknown = recipesJson;
