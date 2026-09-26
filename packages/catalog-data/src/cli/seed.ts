import { mkdirSync, writeFileSync } from "node:fs";
import { validateRecipes } from "../recipes";
import { buildRecipesSql } from "../seed-sql";
import { RECIPES_FILE } from "../specs";

const { recipes, errors } = validateRecipes(RECIPES_FILE);

if (errors.length > 0) {
  console.error(`El catalogo tiene ${errors.length} error(es); corre "pnpm validate" para verlos. No se genero SQL.`);
  process.exit(1);
}
const dir = new URL("../../out/", import.meta.url).pathname;
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}seed-recipes.sql`, buildRecipesSql(recipes));
console.log(`SQL listo: ${dir}seed-recipes.sql (${recipes.length} recetas).`);
console.log("Pasalo a quien lleva Supabase para incluirlo en supabase/seed.sql.");
