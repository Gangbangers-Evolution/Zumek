// SQL idempotente para el seed de recetas. Usa llaves naturales (nombre de receta,
// nombre de producto, termino coloquial) para no depender de como se generen los ids.
import type { RecipeSpec } from "./recipes";
import { CANONICAL_PRODUCTS, COLLOQUIAL_UNITS } from "./specs";
import { pgArray, sqlLiteral as sql } from "./sql";

export function buildRecipesSql(recipes: RecipeSpec[]): string {
  const products = new Map(CANONICAL_PRODUCTS.map((p) => [p.name, p]));
  const used = [...new Set(recipes.flatMap((r) => r.ingredients.map((i) => i.product)))].sort();
  const out: string[] = [
    "-- Generado por packages/catalog-data (pnpm seed) a partir de data/recipes.json.",
    "-- No editar a mano: corregir recipes.json, validar y volver a generar.",
    "begin;",
    "",
    "-- Unidades coloquiales",
  ];
  for (const u of COLLOQUIAL_UNITS) {
    out.push(
      `insert into colloquial_unit (term, base_quantity, base_unit) select ${sql(u.term)}, ${u.base_quantity}, ${sql(u.base_unit)} where not exists (select 1 from colloquial_unit where term = ${sql(u.term)});`,
    );
  }

  out.push("", "-- Productos canonicos que usan las recetas (si el seed de precios ya los creo, no se duplican)");
  for (const name of used) {
    const p = products.get(name)!;
    out.push(
      `insert into canonical_product (name, unit_type, category) select ${sql(p.name)}, ${sql(p.unit_type)}, ${sql(p.category)} where not exists (select 1 from canonical_product where name = ${sql(p.name)});`,
    );
  }

  for (const r of recipes) {
    const recipeId = `(select id from recipe where name = ${sql(r.name)})`;
    out.push(
      "",
      `-- ${r.name}`,
      `insert into recipe (name, cuisine, meal_type, tags, prep_time_minutes, servings_base, allergens) ` +
        `select ${sql(r.name)}, ${sql(r.cuisine)}, ${pgArray(r.meal_type)}, ${pgArray(r.tags)}, ${r.prep_time_minutes}, ${r.servings_base}, ${pgArray(r.allergens)} ` +
        `where not exists (select 1 from recipe where name = ${sql(r.name)});`,
    );
    for (const s of r.steps) {
      out.push(
        `insert into recipe_step (recipe_id, step_order, title, content, timer_seconds) ` +
          `select ${recipeId}, ${s.step_order}, ${sql(s.title)}, ${sql(s.content)}, ${sql(s.timer_seconds)} ` +
          `where not exists (select 1 from recipe_step where recipe_id = ${recipeId} and step_order = ${s.step_order});`,
      );
    }
    for (const ing of r.ingredients) {
      const productId = `(select id from canonical_product where name = ${sql(ing.product)})`;
      out.push(
        `insert into recipe_ingredient (recipe_id, canonical_product_id, quantity, unit) ` +
          `select ${recipeId}, ${productId}, ${ing.quantity}, ${sql(ing.unit)} ` +
          `where not exists (select 1 from recipe_ingredient where recipe_id = ${recipeId} and canonical_product_id = ${productId});`,
      );
    }
  }
  out.push("", "commit;", "");
  return out.join("\n");
}
