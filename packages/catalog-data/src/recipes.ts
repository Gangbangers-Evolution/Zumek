// Validador del catalogo de recetas. Todo lo que aqui es ERROR romperia una regla dura
// del Master Prompt (alergias, unidades, productos inexistentes); las ADVERTENCIAS son
// cosas que una persona debe revisar pero no bloquean.
import { ALLERGENS, MEAL_TYPES, type Allergen, type MealType, type UnitType } from "@zumek/domain";
import {
  CANONICAL_PRODUCTS,
  COLLOQUIAL_UNITS,
  type CanonicalProductSpec,
  type ColloquialUnitSpec,
} from "./specs";

export const SUGGESTED_TAGS = ["rápida", "económica", "alta en proteína", "vegetariana", "ligera", "para niños"];
/** Minimo de recetas por tipo de comida para que una semana no se repita demasiado. */
export const MIN_RECIPES_PER_MEAL_TYPE = 5;

/** Receta ya validada, con cantidades en unidad base. */
export interface RecipeSpec {
  name: string;
  cuisine: string;
  meal_type: MealType[];
  tags: string[];
  prep_time_minutes: number;
  servings_base: number;
  allergens: Allergen[];
  ingredients: Array<{ product: string; quantity: number; unit: UnitType }>;
  steps: Array<{ step_order: number; title: string; content: string; timer_seconds: number | null }>;
}

export interface Issue {
  recipe: string;
  message: string;
}

export interface ValidationResult {
  recipes: RecipeSpec[];
  errors: Issue[];
  warnings: Issue[];
}

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isPositiveInt(v: unknown, max: number): v is number {
  return typeof v === "number" && Number.isInteger(v) && v > 0 && v <= max;
}

function stringList(v: unknown): string[] | null {
  return Array.isArray(v) && v.every((x) => typeof x === "string") ? (v as string[]) : null;
}

function isMealType(value: string): value is MealType {
  return (MEAL_TYPES as readonly string[]).includes(value);
}

function isAllergen(value: string): value is Allergen {
  return (ALLERGENS as readonly string[]).includes(value);
}

function key(text: string): string {
  return text.trim().toLowerCase();
}

export function validateRecipes(
  data: unknown,
  canonicals: CanonicalProductSpec[] = CANONICAL_PRODUCTS,
  colloquials: ColloquialUnitSpec[] = COLLOQUIAL_UNITS,
): ValidationResult {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  const recipes: RecipeSpec[] = [];
  const products = new Map(canonicals.map((p) => [p.name, p]));
  const units = new Map(colloquials.map((u) => [u.term, u]));
  const names = new Set<string>();

  const list = isObj(data) && Array.isArray(data.recipes) ? data.recipes : null;
  if (!list) return { recipes, errors: [{ recipe: "(archivo)", message: 'Falta el arreglo "recipes"' }], warnings };

  list.forEach((raw, index) => {
    const label = isObj(raw) && typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : `receta #${index + 1}`;
    const err = (message: string) => errors.push({ recipe: label, message });
    const warn = (message: string) => warnings.push({ recipe: label, message });
    if (!isObj(raw)) return err("no es un objeto");

    // Datos generales
    if (!(typeof raw.name === "string" && raw.name.trim())) err("falta name");
    else if (names.has(key(raw.name))) err("nombre repetido");
    else names.add(key(raw.name));

    if (!(typeof raw.cuisine === "string" && raw.cuisine.trim())) err("falta cuisine");

    const mealTypes = stringList(raw.meal_type);
    if (!mealTypes || mealTypes.length === 0) err("meal_type debe ser una lista con al menos un valor");
    else for (const m of mealTypes) if (!isMealType(m)) err(`meal_type invalido "${m}" (usa: ${MEAL_TYPES.join(", ")})`);

    const tags = stringList(raw.tags ?? []);
    if (!tags) err("tags debe ser una lista de textos");
    else for (const t of tags) if (!SUGGESTED_TAGS.includes(t)) warn(`tag "${t}" no esta en la lista sugerida (${SUGGESTED_TAGS.join(", ")})`);

    if (!isPositiveInt(raw.prep_time_minutes, 600)) err("prep_time_minutes debe ser entero entre 1 y 600");
    if (!isPositiveInt(raw.servings_base, 20)) err("servings_base debe ser entero entre 1 y 20");

    const declared = stringList(raw.allergens);
    if (!declared) err("allergens debe ser una lista (vacia si no tiene)");
    else for (const a of declared) if (!isAllergen(a)) err(`alergeno "${a}" no esta en la lista fija (${ALLERGENS.join(", ")})`);

    // Ingredientes: siempre producto canonico, cantidad concreta en unidad base
    const ingredients: RecipeSpec["ingredients"] = [];
    const implied = new Map<string, string[]>(); // alergeno -> productos que lo aportan
    if (!Array.isArray(raw.ingredients) || raw.ingredients.length === 0) err("sin ingredientes");
    else {
      const seen = new Set<string>();
      raw.ingredients.forEach((ing, i) => {
        const where = `ingrediente ${i + 1}`;
        if (!isObj(ing) || typeof ing.product !== "string") return err(`${where}: falta product`);
        const product = products.get(ing.product);
        if (!product) return err(`${where}: "${ing.product}" no existe en canonical-products.json`);
        if (seen.has(product.name)) err(`${where}: "${product.name}" repetido; suma las cantidades en una sola linea`);
        seen.add(product.name);

        let quantity: number | null = null;
        if (ing.quantity !== undefined) {
          if (ing.amount !== undefined || ing.unit !== undefined) err(`${where}: usa quantity O amount+unit, no ambos`);
          if (typeof ing.quantity === "number" && ing.quantity > 0) quantity = ing.quantity;
          else err(`${where}: quantity debe ser un numero mayor a 0`);
        } else if (ing.amount !== undefined || ing.unit !== undefined) {
          const unit = typeof ing.unit === "string" ? units.get(ing.unit) : undefined;
          if (!unit) err(`${where}: unidad coloquial "${String(ing.unit)}" desconocida (usa: ${[...units.keys()].join(", ")})`);
          else if (unit.base_unit !== product.unit_type) err(`${where}: "${unit.term}" es ${unit.base_unit} pero ${product.name} se mide en ${product.unit_type}`);
          else if (typeof ing.amount === "number" && ing.amount > 0) quantity = ing.amount * unit.base_quantity;
          else err(`${where}: amount debe ser un numero mayor a 0`);
        } else err(`${where}: falta quantity (o amount + unit)`);

        if (product.unit_type === "unit" && quantity !== null && quantity > 50) warn(`${where}: ${quantity} piezas de ${product.name} parece demasiado`);
        if (quantity !== null) ingredients.push({ product: product.name, quantity, unit: product.unit_type });
        for (const allergen of product.allergens) implied.set(allergen, [...(implied.get(allergen) ?? []), product.name]);
      });
    }

    // Seguridad: todo alergeno que aporta un ingrediente debe estar declarado
    if (declared) {
      for (const [allergen, sources] of implied) {
        if (!declared.includes(allergen)) err(`usa ${sources.join(", ")} (${allergen}) pero no declara "${allergen}" en allergens`);
      }
      for (const allergen of declared) {
        if (!implied.has(allergen)) warn(`declara "${allergen}" pero ningun ingrediente lo aporta; confirma que es intencional`);
      }
    }

    // Pasos
    const steps: RecipeSpec["steps"] = [];
    if (!Array.isArray(raw.steps) || raw.steps.length === 0) err("sin pasos");
    else {
      raw.steps.forEach((step, i) => {
        const where = `paso ${i + 1}`;
        if (!isObj(step)) return err(`${where}: no es un objeto`);
        const title = typeof step.title === "string" ? step.title.trim() : "";
        const content = typeof step.content === "string" ? step.content.trim() : "";
        if (!title) err(`${where}: falta title`);
        else if (title.length > 60) warn(`${where}: title muy largo (${title.length} caracteres; maximo sugerido 60)`);
        if (!content) err(`${where}: falta content`);
        const timer = step.timer_seconds ?? null;
        if (timer !== null && !isPositiveInt(timer, 4 * 3600)) err(`${where}: timer_seconds debe ser null o entero entre 1 y 14400`);
        if (timer === null && /\b\d+\s*(min|minutos|segundos|horas?)\b/i.test(content)) warn(`${where}: el texto menciona un tiempo pero timer_seconds es null`);
        steps.push({ step_order: i + 1, title, content, timer_seconds: timer as number | null });
      });
      if (raw.steps.length < 2) warn("solo tiene 1 paso");
    }

    recipes.push({
      name: label,
      cuisine: typeof raw.cuisine === "string" ? raw.cuisine.trim() : "",
      meal_type: (mealTypes ?? []).filter(isMealType),
      tags: tags ?? [],
      prep_time_minutes: raw.prep_time_minutes as number,
      servings_base: raw.servings_base as number,
      allergens: (declared ?? []).filter(isAllergen),
      ingredients,
      steps,
    });
  });

  // Variedad: con pocas recetas por tipo de comida, la semana se llena de repeticiones
  for (const meal of MEAL_TYPES) {
    const count = recipes.filter((r) => r.meal_type.includes(meal)).length;
    if (count > 0 && count < MIN_RECIPES_PER_MEAL_TYPE) {
      warnings.push({ recipe: "(catalogo)", message: `solo ${count} receta(s) de ${meal}; se sugieren al menos ${MIN_RECIPES_PER_MEAL_TYPE}` });
    }
  }
  return { recipes, errors, warnings };
}
