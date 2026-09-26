// Regenera supabase/seed.sql a partir del catalogo curado (recetas validadas + precios de ejemplo).
import { writeFileSync } from "node:fs";
import { buildSampleCatalog } from "../sample-catalog";
import { buildCatalogSeedSql } from "../seed-sql";

const file = new URL("../../../../supabase/seed.sql", import.meta.url).pathname;
const catalog = buildSampleCatalog(); // truena si alguna receta o precio no es valido
writeFileSync(file, buildCatalogSeedSql(catalog));
console.log(`supabase/seed.sql regenerado: ${catalog.recipes.length} recetas, ${catalog.canonical_products.length} productos, ${catalog.latest_prices.length} precios de ejemplo.`);
