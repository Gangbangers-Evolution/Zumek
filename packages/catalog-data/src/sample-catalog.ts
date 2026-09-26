// Catalogo que usa la app mientras no hay Supabase: las mismas recetas y productos que
// se validan y se siembran en la base, mas precios de ejemplo. Si algo no es valido,
// truena al construirse en lugar de llegar a la app.
import type { Catalog } from "@zumek/domain";
import { canonicalId, recipeId, slugify, storeId } from "./ids";
import { validateRecipes } from "./recipes";
import { CANONICAL_PRODUCTS, COLLOQUIAL_UNITS, RECIPES_FILE, SAMPLE_PRICES, STORES } from "./specs";

const SAMPLE_OBSERVED_AT = "2026-09-20T12:00:00Z";

function assertValid(problems: string[], source: string): void {
  if (problems.length > 0) throw new Error(`${source} no es valido:\n  ${problems.join("\n  ")}`);
}

export function buildSampleCatalog(): Catalog {
  const { recipes, errors } = validateRecipes(RECIPES_FILE);
  assertValid(errors.map((e) => `[${e.recipe}] ${e.message}`), "recipes.json");

  const products = new Map(CANONICAL_PRODUCTS.map((p) => [p.name, p]));
  const storeSlugs = new Set(STORES.map((s) => s.slug));
  assertValid(
    SAMPLE_PRICES.flatMap((p) => [
      ...(products.has(p.product) ? [] : [`${p.package_label}: producto desconocido "${p.product}"`]),
      ...(storeSlugs.has(p.store) ? [] : [`${p.package_label}: tienda desconocida "${p.store}"`]),
      ...(Number.isInteger(p.price_cents) && p.price_cents > 0 ? [] : [`${p.package_label}: price_cents debe ser entero positivo`]),
      ...(p.package_quantity > 0 ? [] : [`${p.package_label}: package_quantity debe ser mayor a 0`]),
    ]),
    "sample-prices.json",
  );

  const commercial = SAMPLE_PRICES.map((p) => ({
    id: `com-${p.store}-${slugify(p.product)}-${p.package_quantity}`,
    canonical_product_id: canonicalId(p.product),
    store_id: storeId(p.store),
    brand: p.brand,
    package_label: p.package_label,
    package_quantity: p.package_quantity,
    package_unit: products.get(p.product)!.unit_type,
    price_cents: p.price_cents,
  }));

  return {
    stores: STORES.map((s) => ({ id: storeId(s.slug), name: s.name, slug: s.slug, active: true })),
    canonical_products: CANONICAL_PRODUCTS.map((p) => ({
      id: canonicalId(p.name),
      name: p.name,
      unit_type: p.unit_type,
      category: p.category,
    })),
    commercial_products: commercial.map(({ price_cents: _price, ...product }) => product),
    latest_prices: commercial.map((c) => ({
      id: `price-${c.id}`,
      commercial_product_id: c.id,
      price_cents: c.price_cents,
      observed_at: SAMPLE_OBSERVED_AT,
    })),
    colloquial_units: COLLOQUIAL_UNITS,
    recipes: recipes.map((r) => ({
      id: recipeId(r.name),
      name: r.name,
      cuisine: r.cuisine,
      meal_type: r.meal_type,
      tags: r.tags,
      prep_time_minutes: r.prep_time_minutes,
      servings_base: r.servings_base,
      allergens: r.allergens,
    })),
    recipe_steps: recipes.flatMap((r) =>
      r.steps.map((s) => ({ id: `${recipeId(r.name)}-step-${s.step_order}`, recipe_id: recipeId(r.name), ...s })),
    ),
    recipe_ingredients: recipes.flatMap((r) =>
      r.ingredients.map((i) => ({
        id: `${recipeId(r.name)}-${canonicalId(i.product)}`,
        recipe_id: recipeId(r.name),
        canonical_product_id: canonicalId(i.product),
        quantity: i.quantity,
        unit: i.unit,
      })),
    ),
  };
}
