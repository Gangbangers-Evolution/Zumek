// El plan lo arma el planner (packages/planner) en el dispositivo, sin red.
import type { IndexedCatalog, PlanBundle } from "@zumek/domain";
import { generatePlan as runPlanner, type PlannerInput, type PlannerPreferences, type Substitutions } from "@zumek/planner";
import type { OnboardingState } from "../state/onboarding";

/** El plan activo y con que se armo: lo necesario para recalcularlo desde el chat. */
export interface ActivePlan {
  bundle: PlanBundle;
  preferences: PlannerPreferences;
  substitutions: Substitutions;
}

/**
 * Respuestas del onboarding -> preferencias del planner, campo por campo. El presupuesto
 * ya lo valido el paso 1 (no deja avanzar sin el); si llega vacio es un bug, no un $0.
 */
function toPlannerPreferences(state: OnboardingState): PlannerPreferences {
  if (state.budgetCents === null) throw new Error("Se intento generar un plan sin presupuesto");
  return {
    budgetCents: state.budgetCents,
    peopleCount: state.peopleCount,
    daysCount: state.daysCount,
    mealTypes: state.mealTypes,
    cuisines: state.cuisines,
    tags: state.tags,
    allergens: state.allergens,
    excludedProductIds: state.excludedProductIds,
    pantry: state.pantry,
    storeIds: state.storeIds,
    savingsWeight: state.savingsWeight,
  };
}

/** Id y fecha de un plan nuevo: el planner es puro y no los inventa. */
export function newPlanIdentity(userId: string): Pick<PlannerInput, "planId" | "userId" | "createdAt"> {
  const now = new Date();
  return {
    // Sufijo aleatorio: dos planes creados en el mismo milisegundo no chocan en la base
    planId: `plan-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    createdAt: now.toISOString(),
  };
}

export async function generatePlan(input: OnboardingState, catalog: IndexedCatalog, userId: string): Promise<ActivePlan> {
  // Cede un tick para que la pantalla "Generando" se pinte antes del calculo.
  await new Promise((resolve) => setTimeout(resolve, 0));
  const preferences = toPlannerPreferences(input);
  const bundle = runPlanner({ catalog, preferences, ...newPlanIdentity(userId) });
  return { bundle, preferences, substitutions: {} };
}
