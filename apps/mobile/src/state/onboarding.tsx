import type { MealType } from "@zumek/domain";
import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";

export interface OnboardingState {
  budgetCents: number | null;
  peopleCount: number;
  daysCount: number;
  mealTypes: MealType[];
  cuisines: string[];
  tags: string[];
  allergens: string[];
  excludedProductIds: string[];
  /** canonical_product_id -> cantidad en unidad base */
  pantry: Record<string, number>;
  storeIds: string[];
  /** 0 = maximo ahorro, 1 = maxima conveniencia */
  savingsWeight: number;
}

export type OnboardingAction =
  | { type: "setBudget"; cents: number | null }
  | { type: "setPeople"; count: number }
  | { type: "setDays"; count: number }
  | { type: "toggle"; field: "mealTypes" | "cuisines" | "tags" | "allergens" | "excludedProductIds" | "storeIds"; value: string }
  | { type: "setPantryItem"; productId: string; quantity: number | null }
  | { type: "setSavingsWeight"; weight: number }
  | { type: "reset"; pantry?: Record<string, number> };

export const initialOnboardingState: OnboardingState = {
  budgetCents: null,
  peopleCount: 2,
  daysCount: 7,
  mealTypes: ["comida", "cena"],
  cuisines: [],
  tags: [],
  allergens: [],
  excludedProductIds: [],
  pantry: {},
  storeIds: [],
  savingsWeight: 0.5,
};

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case "setBudget":
      return { ...state, budgetCents: action.cents };
    case "setPeople":
      return { ...state, peopleCount: action.count };
    case "setDays":
      return { ...state, daysCount: action.count };
    case "toggle":
      return { ...state, [action.field]: toggle(state[action.field] as string[], action.value) };
    case "setPantryItem": {
      const pantry = { ...state.pantry };
      if (action.quantity === null) delete pantry[action.productId];
      else pantry[action.productId] = action.quantity;
      return { ...state, pantry };
    }
    case "setSavingsWeight":
      return { ...state, savingsWeight: action.weight };
    case "reset":
      return { ...initialOnboardingState, pantry: action.pantry ?? {} };
  }
}

const OnboardingContext = createContext<{
  state: OnboardingState;
  dispatch: Dispatch<OnboardingAction>;
} | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(onboardingReducer, initialOnboardingState);
  return <OnboardingContext.Provider value={{ state, dispatch }}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding fuera de OnboardingProvider");
  return ctx;
}
