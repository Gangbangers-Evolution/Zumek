// Convierte un Catalog del dominio en el SQL de supabase/seed.sql, con los mismos ids que
// usa la app: la base y buildSampleCatalog() quedan identicas. Idempotente (on conflict).
import type { Catalog } from "@zumek/domain";
import { pgArray, sqlLiteral as sql } from "./sql";

type Value = string | number | null;

/** Un INSERT de varias filas; los arreglos de Postgres llegan ya convertidos con pgArray. */
function insert(table: string, columns: string[], rows: string[][]): string {
  if (rows.length === 0) return `-- ${table}: sin filas`;
  return (
    `insert into public.${table} (${columns.join(", ")}) values\n` +
    rows.map((values) => `  (${values.join(", ")})`).join(",\n") +
    `\non conflict do nothing;`
  );
}

const v = (value: Value) => sql(value);

export function buildCatalogSeedSql(catalog: Catalog): string {
  return [
    [
      "-- GENERADO por packages/catalog-data (pnpm seed). No editar a mano:",
      "-- corregir los JSON de packages/catalog-data/data, validar y volver a generar.",
      "-- Incluye los precios DE EJEMPLO (sample-prices.json); los reales llegan con el seed del scraper.",
    ].join("\n"),
    insert("store", ["id", "name", "slug", "active"], catalog.stores.map((s) => [v(s.id), v(s.name), v(s.slug), String(s.active)])),
    insert(
      "canonical_product",
      ["id", "name", "unit_type", "category"],
      catalog.canonical_products.map((p) => [v(p.id), v(p.name), v(p.unit_type), v(p.category)]),
    ),
    insert(
      "colloquial_unit",
      ["term", "base_quantity", "base_unit"],
      catalog.colloquial_units.map((u) => [v(u.term), v(u.base_quantity), v(u.base_unit)]),
    ),
    insert(
      "recipe",
      ["id", "name", "cuisine", "meal_type", "tags", "prep_time_minutes", "servings_base", "allergens"],
      catalog.recipes.map((r) => [
        v(r.id),
        v(r.name),
        v(r.cuisine),
        pgArray(r.meal_type),
        pgArray(r.tags),
        v(r.prep_time_minutes),
        v(r.servings_base),
        pgArray(r.allergens),
      ]),
    ),
    insert(
      "recipe_step",
      ["id", "recipe_id", "step_order", "title", "content", "timer_seconds"],
      catalog.recipe_steps.map((s) => [v(s.id), v(s.recipe_id), v(s.step_order), v(s.title), v(s.content), v(s.timer_seconds)]),
    ),
    insert(
      "recipe_ingredient",
      ["id", "recipe_id", "canonical_product_id", "quantity", "unit"],
      catalog.recipe_ingredients.map((i) => [v(i.id), v(i.recipe_id), v(i.canonical_product_id), v(i.quantity), v(i.unit)]),
    ),
    insert(
      "commercial_product",
      ["id", "canonical_product_id", "store_id", "brand", "package_label", "package_quantity", "package_unit"],
      catalog.commercial_products.map((c) => [
        v(c.id),
        v(c.canonical_product_id),
        v(c.store_id),
        v(c.brand),
        v(c.package_label),
        v(c.package_quantity),
        v(c.package_unit),
      ]),
    ),
    // price_observation es INSERT-only: el seed solo agrega la observacion inicial.
    insert(
      "price_observation",
      ["id", "commercial_product_id", "price_cents", "observed_at"],
      catalog.latest_prices.map((p) => [v(p.id), v(p.commercial_product_id), v(p.price_cents), v(p.observed_at)]),
    ),
    "",
  ].join("\n\n");
}
