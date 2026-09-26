import { mkdirSync, writeFileSync } from "node:fs";
import { loadCanonicalProducts, loadColloquialUnits, loadRecipesFile } from "./files";
import { buildRecipesSql } from "./seed";
import { validateCatalog } from "./validate";

const canonicals = loadCanonicalProducts();
const colloquials = loadColloquialUnits();
const { recipes, errors } = validateCatalog(loadRecipesFile(), canonicals, colloquials);

if (errors.length > 0) {
  console.error(`El catalogo tiene ${errors.length} error(es); corre "pnpm validate" para verlos. No se genero SQL.`);
  process.exit(1);
}
const dir = new URL("../out/", import.meta.url).pathname;
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}seed-recipes.sql`, buildRecipesSql(recipes, canonicals, colloquials));
console.log(`SQL listo: ${dir}seed-recipes.sql (${recipes.length} recetas).`);
console.log("Pasalo a quien lleva Supabase para incluirlo en supabase/seed.sql.");
