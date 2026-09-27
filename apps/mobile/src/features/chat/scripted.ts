// Modo demo del chat: respuestas preconfiguradas por intencion (palabras clave), sin LLM.
// Solo el TEXTO es fijo: toda propuesta de cambio sale del planner igual que con la IA,
// asi que los montos que ve el usuario son reales. La UI avisa que es un modo demo.
import type { IndexedCatalog } from "@zumek/domain";
import { effectiveIngredients } from "@zumek/planner";
import type { ChatProposal, ChatReply } from "@zumek/supabase-client";
import { computeChange } from "../../data/plan-changes";
import type { ActivePlan } from "../../data/plan-source";
import { dayLabel, MEAL_TYPE_LABEL } from "../../lib/labels";
import { formatCents, parsePesosToCents } from "../../lib/money";

interface ScriptContext {
  active: ActivePlan;
  catalog: IndexedCatalog;
  cooking?: { recipeId: string; stepIndex: number };
}

/** Minusculas y sin acentos: "Qué" y "que" cuentan igual. */
function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

const HELP =
  'Puedo ayudarte con tu semana. Prueba con: "hazlo más barato", "cambia mi presupuesto a $700", "no me gusta el queso" o "¿por qué armaste así el plan?".';

export function scriptedReply(message: string, ctx: ScriptContext): ChatReply {
  const text = normalize(message);
  if (ctx.cooking) return cookingReply(text, ctx.catalog, ctx.cooking);

  // El orden importa: una peticion concreta (monto, ingrediente, comida) gana a una general.
  return (
    budgetReply(text, ctx) ??
    ingredientReply(text, ctx) ??
    mealReply(text, ctx) ??
    cheaperReply(text, ctx) ??
    explainReply(text, ctx) ?? { text: HELP }
  );
}

function budgetReply(text: string, { active }: ScriptContext): ChatReply | null {
  if (!/presupuesto|gastar|\$\s*\d|\d\s*(pesos|mxn)/.test(text)) return null;
  const amount = text.match(/\$?\s*(\d[\d,]*(?:\.\d{1,2})?)/)?.[1];
  const cents = amount ? parsePesosToCents(amount.replace(/,/g, "")) : null;
  if (!cents) {
    return {
      text: `Tu presupuesto actual es de ${formatCents(active.preferences.budgetCents)}. Dime el nuevo monto, por ejemplo: "cambia mi presupuesto a $700".`,
    };
  }
  return {
    text: `Va, recalculo tu semana con ${formatCents(cents)} de presupuesto.`,
    proposal: { tool: "update_budget", input: { new_budget_cents: cents } },
  };
}

function ingredientReply(text: string, { active, catalog }: ScriptContext): ChatReply | null {
  if (!/cambi|sustitu|reemplaz|no me gusta|sin |no tengo|otro|otra/.test(text)) return null;
  // Gana el ingrediente del plan cuyo nombre coincide con mas palabras del mensaje
  // ("queso fresco" elige Queso fresco y no Queso Oaxaca). Empate: el primero del plan.
  let best: { recipeId: string; canonicalProductId: string; name: string; score: number } | null = null;
  for (const meal of active.bundle.meals) {
    for (const ing of effectiveIngredients(catalog, meal.recipe_id, active.substitutions)) {
      const product = catalog.productById.get(ing.canonical_product_id);
      if (!product) continue;
      const words = normalize(product.name).split(/[\s()]+/).filter((w) => w.length >= 4);
      const score = words.filter((w) => text.includes(w)).length;
      if (score > (best?.score ?? 0)) {
        best = { recipeId: meal.recipe_id, canonicalProductId: ing.canonical_product_id, name: product.name, score };
      }
    }
  }
  if (!best) return null;
  const recipe = catalog.recipeById.get(best.recipeId)!;
  return {
    text: `Busco un sustituto para ${best.name.toLowerCase()} en ${recipe.name} que respete tus alergias y tiendas.`,
    proposal: {
      tool: "swap_ingredient",
      input: { recipe_id: best.recipeId, canonical_product_id: best.canonicalProductId, reason: text.slice(0, 200) },
    },
  };
}

function mealReply(text: string, { active, catalog }: ScriptContext): ChatReply | null {
  if (!/cambi|otra receta|no me gusta|quita|reemplaz/.test(text)) return null;
  const day = text.match(/dia\s*(\d)/)?.[1];
  const meal = active.bundle.meals.find((m) => {
    // Por nombre basta la primera palabra ("enfrijoladas", "spaghetti").
    const first = normalize(catalog.recipeById.get(m.recipe_id)?.name ?? "").split(" ")[0] ?? "";
    const byName = first.length >= 4 && text.includes(first);
    const bySlot = day !== undefined && m.day_index === Number(day) - 1 && text.includes(m.meal_type);
    return byName || bySlot;
  });
  if (!meal) return null;
  return {
    text: `Busco otra receta para ${dayLabel(meal.day_index).toLowerCase()} (${MEAL_TYPE_LABEL[meal.meal_type].toLowerCase()}) que cumpla tus restricciones.`,
    proposal: {
      tool: "swap_recipe",
      input: { day_index: meal.day_index, meal_type: meal.meal_type, exclude_recipe_id: meal.recipe_id },
    },
  };
}

function cheaperReply(text: string, { active, catalog }: ScriptContext): ChatReply | null {
  if (!/barat|ahorr|menos|economic|caro/.test(text)) return null;
  // Se prueba cambiar cada comida con el planner y se propone la que mas ahorra.
  let best: { proposal: ChatProposal; delta: number; label: string } | null = null;
  for (const meal of active.bundle.meals) {
    const proposal: ChatProposal = {
      tool: "swap_recipe",
      input: { day_index: meal.day_index, meal_type: meal.meal_type, exclude_recipe_id: meal.recipe_id },
    };
    const result = computeChange(proposal, active, catalog);
    if (result.ok && result.change.deltaCents < (best?.delta ?? 0)) {
      best = { proposal, delta: result.change.deltaCents, label: catalog.recipeById.get(meal.recipe_id)?.name ?? "" };
    }
  }
  if (!best) return { text: "Revisé cada comida y tu plan ya es lo más barato posible con tus preferencias." };
  return { text: `Revisé cada comida de tu semana: cambiar ${best.label} es lo que más ahorra.`, proposal: best.proposal };
}

function explainReply(text: string, { active, catalog }: ScriptContext): ChatReply | null {
  if (!/por que|porque|explica|como armaste|reutiliz/.test(text)) return null;
  const { plan, meals } = active.bundle;
  // Ingredientes que comparten varias recetas: un mismo paquete rinde para varias comidas.
  const usedBy = new Map<string, Set<string>>();
  for (const meal of meals) {
    for (const ing of effectiveIngredients(catalog, meal.recipe_id, active.substitutions)) {
      const set = usedBy.get(ing.canonical_product_id) ?? new Set<string>();
      set.add(meal.recipe_id);
      usedBy.set(ing.canonical_product_id, set);
    }
  }
  const shared = [...usedBy]
    .filter(([, recipes]) => recipes.size > 1)
    .map(([id]) => catalog.productById.get(id)?.name.toLowerCase())
    .filter(Boolean)
    .slice(0, 3);
  const budget =
    plan.total_cost_cents <= plan.budget_cents
      ? `cabe en tu presupuesto (${formatCents(plan.total_cost_cents)} de ${formatCents(plan.budget_cents)})`
      : `queda en ${formatCents(plan.total_cost_cents)}, lo más cerca que pudimos de ${formatCents(plan.budget_cents)}`;
  const reuse = shared.length > 0 ? ` Elegí recetas que comparten ${shared.join(", ")}, así un mismo paquete rinde para varias comidas.` : "";
  return { text: `Tu semana ${budget}.${reuse} Siempre se compra el paquete completo y lo que sobra pasa a tu despensa.` };
}

function cookingReply(text: string, catalog: IndexedCatalog, { recipeId, stepIndex }: NonNullable<ScriptContext["cooking"]>): ChatReply {
  const steps = catalog.stepsByRecipe.get(recipeId) ?? [];
  const step = steps[stepIndex];
  if (!step) return { text: "No encuentro este paso de la receta." };
  if (/cuanto|tiempo|minuto|timer|temporizador/.test(text)) {
    return {
      text:
        step.timer_seconds !== null
          ? `Este paso lleva unos ${Math.round(step.timer_seconds / 60)} minutos. Puedes usar el temporizador de la pantalla.`
          : "Este paso no tiene un tiempo fijo: guíate por lo que indica la receta.",
    };
  }
  if (/siguiente|despues|luego/.test(text)) {
    const next = steps[stepIndex + 1];
    return { text: next ? `Después sigue: ${next.title}. ${next.content}` : "Este es el último paso. ¡Ya casi terminas!" };
  }
  return { text: `En este paso: ${step.content}` };
}
