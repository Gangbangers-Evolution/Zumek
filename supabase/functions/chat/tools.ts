import type Anthropic from "npm:@anthropic-ai/sdk";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

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
    description: "Propone cambiar la receta de una comida especifica por otra que cumpla las mismas restricciones.",
    input_schema: {
      type: "object",
      properties: {
        day_index: { type: "integer", minimum: 0, maximum: 6, description: "0 = primer dia del plan" },
        meal_type: { type: "string", enum: ["desayuno", "comida", "cena", "snack"] },
        exclude_recipe_id: { type: "string", description: "Id de la receta que se quiere quitar" },
      },
      required: ["day_index", "meal_type", "exclude_recipe_id"],
    },
  },
  {
    name: "swap_ingredient",
    description: "Propone sustituir un ingrediente de una receta por otro de la misma categoria y tipo de unidad.",
    input_schema: {
      type: "object",
      properties: {
        recipe_id: { type: "string" },
        canonical_product_id: { type: "string", description: "Ingrediente que se quiere quitar" },
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
    description: "Obtiene los datos del plan actual (recetas, costo e ingredientes reutilizados) para explicar por que se armo asi.",
    input_schema: { type: "object", properties: {} },
  },
];

export const TOOL_NAMES = new Set(TOOLS.map((t) => t.name));
export const READ_ONLY_TOOLS = new Set(["get_recipe_step", "explain_plan"]);

export async function runReadOnlyTool(
  supabase: SupabaseClient,
  name: string,
  input: unknown,
  planId: string,
): Promise<unknown> {
  if (name === "get_recipe_step") {
    const { recipe_id, step_index } = input as { recipe_id: string; step_index: number };
    const { data } = await supabase
      .from("recipe_step")
      .select("step_order, title, content, timer_seconds")
      .eq("recipe_id", recipe_id)
      .eq("step_order", step_index + 1)
      .maybeSingle();
    return data ?? { error: "Ese paso no existe" };
  }

  if (name === "explain_plan") {
    // El plan_id sale de la peticion de la app, no de Claude. RLS impide leer planes ajenos.
    const { data: plan } = await supabase
      .from("plan")
      .select("budget_cents, total_cost_cents, status, people_count, days_count")
      .eq("id", planId)
      .maybeSingle();
    if (!plan) return { error: "No encontre ese plan" };
    const { data: meals } = await supabase
      .from("plan_meal")
      .select("day_index, meal_type, recipe_id, recipe(name)")
      .eq("plan_id", planId);
    const recipeIds = [...new Set((meals ?? []).map((m) => m.recipe_id))];
    const { data: ingredients } = await supabase
      .from("recipe_ingredient")
      .select("recipe_id, canonical_product(name)")
      .in("recipe_id", recipeIds);
    // Ingredientes que aparecen en mas de una receta = reutilizacion de paquetes
    const usage = new Map<string, number>();
    for (const i of ingredients ?? []) {
      const product = i.canonical_product as unknown as { name: string } | null;
      if (product) usage.set(product.name, (usage.get(product.name) ?? 0) + 1);
    }
    const reused = [...usage].filter(([, n]) => n > 1).map(([ingredient, recipes]) => ({ ingredient, recipes }));
    return { plan, meals, reused_ingredients: reused };
  }

  return { error: "Tool desconocida" };
}
