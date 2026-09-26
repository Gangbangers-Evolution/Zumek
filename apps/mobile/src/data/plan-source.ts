// Fase 1: no se llama al planner. Se espera un momento y se regresa un fixture
// cuyo status corresponde al presupuesto capturado. En Fase 3 se conecta packages/planner.
import type { PlanBundle } from "@zumek/domain";
import {
  planInfeasibleFixture,
  planOkFixture,
  planOverBudgetCloseFixture,
} from "@zumek/domain/fixtures";
import type { OnboardingState } from "../state/onboarding";
import { delay } from "./fake";

function withBudget(bundle: PlanBundle, budgetCents: number): PlanBundle {
  return { ...bundle, plan: { ...bundle.plan, budget_cents: budgetCents } };
}

export async function generatePlan(input: OnboardingState): Promise<PlanBundle> {
  await delay(1800);
  const budget = input.budgetCents ?? 0;
  const cost = planOkFixture.plan.total_cost_cents;
  if (budget >= cost) return withBudget(planOkFixture, budget);
  if (budget * 1.1 >= cost) return withBudget(planOverBudgetCloseFixture, budget);
  return withBudget(planInfeasibleFixture, budget);
}
