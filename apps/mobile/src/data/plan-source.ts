// El plan lo arma el planner (packages/planner) en el dispositivo, sin red.
import type { IndexedCatalog, PlanBundle } from "@zumek/domain";
import { generatePlan as runPlanner, type PlannerPreferences } from "@zumek/planner";
import type { OnboardingState } from "../state/onboarding";

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

export async function generatePlan(input: OnboardingState, catalog: IndexedCatalog, userId: string): Promise<PlanBundle> {
  // Cede un tick para que la pantalla "Generando" se pinte antes del calculo.
  await new Promise((resolve) => setTimeout(resolve, 0));
  const now = new Date();
  return runPlanner({
    catalog,
    // Sufijo aleatorio: dos planes creados en el mismo milisegundo no chocan en la base
    planId: `plan-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    createdAt: now.toISOString(),
    preferences: toPlannerPreferences(input),
  });
}
