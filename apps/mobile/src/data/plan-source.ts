// Fase 3: el plan lo arma el planner real (packages/planner) en el dispositivo.
// En Fase 2 el catalogo vendra de Supabase y el userId de Anonymous Auth.
import type { IndexedCatalog, PlanBundle } from "@zumek/domain";
import { generatePlan as runPlanner, type PlannerPreferences } from "@zumek/planner";
import type { OnboardingState } from "../state/onboarding";
import { delay } from "./fake";
import { LOCAL_USER_ID } from "./session";

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

export async function generatePlan(input: OnboardingState, catalog: IndexedCatalog): Promise<PlanBundle> {
  // Cede un tick para que la pantalla "Generando" se pinte antes del calculo.
  await delay(0);
  const now = new Date();
  return runPlanner({
    catalog,
    planId: `plan-${now.getTime()}`,
    userId: LOCAL_USER_ID,
    createdAt: now.toISOString(),
    preferences: toPlannerPreferences(input),
  });
}
