import { MEAL_TYPES } from "@zumek/domain";
import { RECIPES_FILE } from "../specs";
import { validateRecipes, type Issue } from "../recipes";

const { recipes, errors, warnings } = validateRecipes(RECIPES_FILE);

const print = (title: string, issues: Issue[]) => {
  if (issues.length === 0) return;
  console.log(`\n${title} (${issues.length}):`);
  for (const i of issues) console.log(`  - [${i.recipe}] ${i.message}`);
};

console.log(`${recipes.length} receta(s) leidas`);
console.log(
  "Por tipo de comida: " +
    MEAL_TYPES.map((m) => `${m} ${recipes.filter((r) => r.meal_type.includes(m)).length}`).join(" · "),
);
print("ERRORES (hay que corregirlos)", errors);
print("Advertencias (revisar)", warnings);

if (errors.length > 0) {
  console.log("\nEl catalogo NO es valido.");
  process.exit(1);
}
console.log("\nCatalogo valido. Siguiente paso: pnpm seed");
