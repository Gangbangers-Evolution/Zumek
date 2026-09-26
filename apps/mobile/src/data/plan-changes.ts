// Propuestas del chat -> plan recalculado por el planner. La IA solo elige que cambiar;
// el costo y el plan nuevo salen de aqui, y se aplican solo si el usuario confirma.
import type { IndexedCatalog } from "@zumek/domain";
import { generatePlan, swapIngredient, swapMeal } from "@zumek/planner";
import type { ChatProposal } from "@zumek/supabase-client";
import { dayLabel, MEAL_TYPE_LABEL } from "../lib/labels";
import { formatCents } from "../lib/money";
import { newPlanIdentity, type ActivePlan } from "./plan-source";

export interface PlanChange {
  /** Que cambia, en texto para el usuario ("Día 2, Comida: A → B"). */
  description: string;
  /** Nuevo total menos el actual (negativo = ahorro). */
  deltaCents: number;
  /** Id del plan sobre el que se calculo: si el plan cambio despues, ya no aplica. */
  basePlanId: string;
  next: ActivePlan;
}

export type ChangeResult = { ok: true; change: PlanChange } | { ok: false; reason: string };

const fail = (reason: string): ChangeResult => ({ ok: false, reason });

export function computeChange(proposal: ChatProposal, current: ActivePlan, catalog: IndexedCatalog): ChangeResult {
  const { bundle, preferences, substitutions } = current;
  const identity = newPlanIdentity(bundle.plan.user_id);
  const recipeName = (id: string) => catalog.recipeById.get(id)?.name ?? "esta receta";
  const done = (description: string, next: ActivePlan): ChangeResult => ({
    ok: true,
    change: {
      description,
      deltaCents: next.bundle.plan.total_cost_cents - bundle.plan.total_cost_cents,
      basePlanId: bundle.plan.id,
      next,
    },
  });

  switch (proposal.tool) {
    case "update_budget": {
      const budgetCents = proposal.input.new_budget_cents;
      if (budgetCents === preferences.budgetCents) return fail("Ese ya es tu presupuesto actual.");
      const nextPreferences = { ...preferences, budgetCents };
      const next = generatePlan({ catalog, preferences: nextPreferences, substitutions, ...identity });
      if (next.plan.status === "infeasible_likely") {
        return fail(`Con ${formatCents(budgetCents)} no encontramos un plan viable para tu semana.`);
      }
      return done(
        `Presupuesto: ${formatCents(preferences.budgetCents)} → ${formatCents(budgetCents)}, con el menú recalculado`,
        { bundle: next, preferences: nextPreferences, substitutions },
      );
    }

    case "swap_recipe": {
      const { day_index: dayIndex, meal_type: mealType, exclude_recipe_id: excludeRecipeId } = proposal.input;
      const next = swapMeal({ catalog, preferences, substitutions, ...identity }, bundle, { dayIndex, mealType, excludeRecipeId });
      const chosen = next?.meals.find((m) => m.day_index === dayIndex && m.meal_type === mealType);
      if (!next || !chosen) return fail("No encontramos otra receta que cumpla tus restricciones para esa comida.");
      if (next.plan.status === "infeasible_likely") {
        return fail("Cambiar esa comida dejaría tu plan muy por encima del presupuesto.");
      }
      return done(
        `${dayLabel(dayIndex)}, ${MEAL_TYPE_LABEL[mealType]}: ${recipeName(excludeRecipeId)} → ${recipeName(chosen.recipe_id)}`,
        { bundle: next, preferences, substitutions },
      );
    }

    case "swap_ingredient": {
      const { recipe_id: recipeId, canonical_product_id: canonicalProductId } = proposal.input;
      const result = swapIngredient({ catalog, preferences, substitutions, ...identity }, bundle, { recipeId, canonicalProductId });
      if (!result) return fail("No encontramos un sustituto de la misma categoría que respete tus alergias y tiendas.");
      if (result.bundle.plan.status === "infeasible_likely") {
        return fail("Ese cambio de ingrediente dejaría tu plan muy por encima del presupuesto.");
      }
      const productName = (id: string) => catalog.productById.get(id)?.name ?? "ese ingrediente";
      const replacedId = substitutions[recipeId]?.[canonicalProductId] ?? canonicalProductId;
      return done(
        `En ${recipeName(recipeId)}: ${productName(replacedId)} → ${productName(result.substituteId)}`,
        { bundle: result.bundle, preferences, substitutions: result.substitutions },
      );
    }
  }
}
