// Fase 3: el plan lo arma el planner real (packages/planner) en el dispositivo.
// En Fase 2 el catalogo vendra de Supabase y el userId de Anonymous Auth.
import type { IndexedCatalog, PlanBundle } from "@zumek/domain";
import { generatePlan as runPlanner } from "@zumek/planner";
import type { OnboardingState } from "../state/onboarding";
import { delay } from "./fake";
import { LOCAL_USER_ID } from "./session";

export async function generatePlan(input: OnboardingState, catalog: IndexedCatalog): Promise<PlanBundle> {
  // Cede un tick para que la pantalla "Generando" se pinte antes del calculo.
  await delay(0);
  const now = new Date();
  return runPlanner({
    catalog,
    planId: `plan-${now.getTime()}`,
    userId: LOCAL_USER_ID,
    createdAt: now.toISOString(),
    preferences: { ...input, budgetCents: input.budgetCents ?? 0 },
  });
}
