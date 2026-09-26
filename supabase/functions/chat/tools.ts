import type Anthropic from "npm:@anthropic-ai/sdk";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

// Catalogo cerrado (seccion 6). Ninguna tool calcula: las que cambian el plan solo se
// proponen y la app las calcula con el planner cuando el usuario confirma.
export const TOOLS: Anthropic.Tool[] = [
  {
    name: "update_budget",
    description: "Propone cambiar el presupuesto semanal y volver a generar todo el plan. Usala cuando el usuario pida gastar mas o menos en total.",
    input_schema: {
      type: "object",
      properties: {
        new_budget_cents: { type: "integer", minimum: 1, description: "Nuevo presupuesto en centavos MXN. $900.00 = 90000" },
      },
      required: ["new_budget_cents"],
    },
  },
  {
    name: "swap_recipe",
    description: "Propone cambiar la receta de una comida especifica del plan por otra que cumpla las mismas restricciones.",
    input_schema: {
      type: "object",
      properties: {
        day_index: { type: "integer", minimum: 0, maximum: 6, description: "0 = primer dia del plan" },
        meal_type: { type: "string", enum: ["desayuno", "comida", "cena", "snack"] },
        exclude_recipe_id: { type: "string", description: "Id de la receta que se quiere quitar (del contexto del plan)" },
      },
      required: ["day_index", "meal_type", "exclude_recipe_id"],
    },
  },
  {
    name: "swap_ingredient",
    description: "Propone sustituir un ingrediente de una receta del plan por otro de la misma categoria y tipo de unidad.",
    input_schema: {
      type: "object",
      properties: {
        recipe_id: { type: "string" },
        canonical_product_id: { type: "string", description: "Id del ingrediente que se quiere quitar (del contexto del plan)" },
        reason: { type: "string", description: "Por que lo quiere cambiar, en palabras del usuario" },
      },
      required: ["recipe_id", "canonical_product_id", "reason"],
    },
  },
  {
    name: "get_recipe_step",
    description: "Lee un paso de una receta tal como esta guardado. Usala en el asistente de cocina.",
    input_schema: {
      type: "object",
      properties: {
        recipe_id: { type: "string" },
        step_index: { type: "integer", minimum: 0, description: "0 = primer paso" },
      },
      required: ["recipe_id", "step_index"],
    },
  },
  {
    name: "explain_plan",
    description: "Obtiene los datos del plan actual (costo, estado e ingredientes reutilizados entre recetas) para explicar por que se armo asi.",
    input_schema: { type: "object", properties: {} },
  },
];

export const TOOL_NAMES = new Set(TOOLS.map((t) => t.name));
export const READ_ONLY_TOOLS = new Set(["get_recipe_step", "explain_plan"]);

const MEAL_TYPES = new Set(["desayuno", "comida", "cena", "snack"]);
// Tope de cordura: un presupuesto semanal de mas de $100,000 es un error de unidades.
const MAX_BUDGET_CENTS = 10_000_000;

/** Lo que el modelo necesita saber del plan para elegir ids reales. Sale de la base (RLS). */
export interface PlanContext {
  plan: { budget_cents: number; total_cost_cents: number; status: string; people_count: number; days_count: number };
  meals: { day_index: number; meal_type: string; recipe_id: string; recipe_name: string }[];
  ingredients: Record<string, { canonical_product_id: string; name: string }[]>;
}

export async function loadPlanContext(supabase: SupabaseClient, planId: string): Promise<PlanContext | null> {
  const { data: plan } = await supabase
    .from("plan")
    .select("budget_cents, total_cost_cents, status, people_count, days_count")
    .eq("id", planId)
    .maybeSingle();
  if (!plan) return null;
  const { data: meals } = await supabase
    .from("plan_meal")
    .select("day_index, meal_type, recipe_id, recipe(name)")
    .eq("plan_id", planId)
    .order("day_index");
  const recipeIds = [...new Set((meals ?? []).map((m) => m.recipe_id as string))];
  const { data: rows } = await supabase
    .from("recipe_ingredient")
    .select("recipe_id, canonical_product_id, canonical_product(name)")
    .in("recipe_id", recipeIds);

  const ingredients: PlanContext["ingredients"] = {};
  for (const row of rows ?? []) {
    const product = row.canonical_product as unknown as { name: string } | null;
    (ingredients[row.recipe_id] ??= []).push({ canonical_product_id: row.canonical_product_id, name: product?.name ?? "" });
  }
  return {
    plan,
    meals: (meals ?? []).map((m) => ({
      day_index: m.day_index,
      meal_type: m.meal_type,
      recipe_id: m.recipe_id,
      recipe_name: (m.recipe as unknown as { name: string } | null)?.name ?? "",
    })),
    ingredients,
  };
}

/**
 * Revisa una propuesta del modelo contra el plan real antes de mandarla a la app.
 * Regresa el input limpio (solo los campos del schema) o null si no corresponde.
 */
export function validateProposal(name: string, raw: unknown, ctx: PlanContext): Record<string, unknown> | null {
  const input = (raw ?? {}) as Record<string, unknown>;
  if (name === "update_budget") {
    const cents = input.new_budget_cents;
    return Number.isInteger(cents) && (cents as number) > 0 && (cents as number) <= MAX_BUDGET_CENTS
      ? { new_budget_cents: cents }
      : null;
  }
  if (name === "swap_recipe") {
    const { day_index, meal_type, exclude_recipe_id } = input;
    const exists = ctx.meals.some(
      (m) => m.day_index === day_index && m.meal_type === meal_type && m.recipe_id === exclude_recipe_id,
    );
    return exists && typeof meal_type === "string" && MEAL_TYPES.has(meal_type)
      ? { day_index, meal_type, exclude_recipe_id }
      : null;
  }
  if (name === "swap_ingredient") {
    const { recipe_id, canonical_product_id, reason } = input;
    const inPlan = typeof recipe_id === "string" && ctx.meals.some((m) => m.recipe_id === recipe_id);
    const hasIngredient = inPlan && ctx.ingredients[recipe_id]?.some((i) => i.canonical_product_id === canonical_product_id);
    return hasIngredient ? { recipe_id, canonical_product_id, reason: typeof reason === "string" ? reason.slice(0, 200) : "" } : null;
  }
  return null;
}

export async function runReadOnlyTool(
  supabase: SupabaseClient,
  name: string,
  input: unknown,
  ctx: PlanContext,
): Promise<unknown> {
  if (name === "get_recipe_step") {
    const { recipe_id, step_index } = (input ?? {}) as { recipe_id?: unknown; step_index?: unknown };
    if (typeof recipe_id !== "string" || !Number.isInteger(step_index)) return { error: "Datos del paso invalidos" };
    const { data } = await supabase
      .from("recipe_step")
      .select("step_order, title, content, timer_seconds")
      .eq("recipe_id", recipe_id)
      .eq("step_order", (step_index as number) + 1)
      .maybeSingle();
    return data ?? { error: "Ese paso no existe" };
  }

  if (name === "explain_plan") {
    // Ingredientes que aparecen en mas de una receta = paquetes reutilizados en la semana
    const usage = new Map<string, Set<string>>();
    for (const meal of ctx.meals) {
      for (const ing of ctx.ingredients[meal.recipe_id] ?? []) {
        const recipes = usage.get(ing.name) ?? new Set<string>();
        recipes.add(meal.recipe_name);
        usage.set(ing.name, recipes);
      }
    }
    const reused = [...usage]
      .filter(([, recipes]) => recipes.size > 1)
      .map(([ingredient, recipes]) => ({ ingredient, recipes: [...recipes] }));
    return { plan: ctx.plan, meals: ctx.meals, reused_ingredients: reused };
  }

  return { error: "Tool desconocida" };
}
