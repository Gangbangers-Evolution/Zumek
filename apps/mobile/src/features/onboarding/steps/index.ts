import type { ComponentType } from "react";
import type { IconName } from "../../../components/Icon";
import type { OnboardingState } from "../../../state/onboarding";
import { BudgetStep } from "./budget";
import { CuisinesStep } from "./cuisines";
import { ExcludedStep } from "./excluded";
import { MealsStep } from "./meals";
import { PantryStep } from "./pantry";
import { PeopleDaysStep } from "./people-days";
import { PreferencesStep } from "./preferences";
import { SavingsStep } from "./savings";
import { StoresStep } from "./stores";

export interface OnboardingStep {
  badge: { label: string; icon: IconName };
  /** "money": el paso trata del dinero del usuario y se pinta en coral, como en el mockup. */
  tone?: "money";
  title: string;
  subtitle: string;
  isValid: (state: OnboardingState) => boolean;
  Component: ComponentType;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    badge: { label: "Paso inicial", icon: "wallet" },
    tone: "money",
    title: "¿Cuál es tu presupuesto?",
    subtitle: "Armamos tu semana alrededor de este presupuesto, sin desperdiciar comida.",
    isValid: (s) => s.budgetCents !== null && s.budgetCents > 0,
    Component: BudgetStep,
  },
  {
    badge: { label: "Porciones", icon: "group" },
    title: "¿Para cuántos y cuántos días?",
    subtitle: "Esto nos ayuda a calcular las porciones exactas y evitar desperdicios.",
    isValid: (s) => s.peopleCount >= 1 && s.daysCount >= 1 && s.daysCount <= 7,
    Component: PeopleDaysStep,
  },
  {
    badge: { label: "Hábito culinario", icon: "restaurant" },
    title: "¿Qué comidas deseas incluir?",
    subtitle: "Selecciona las comidas que preparas en casa durante la semana.",
    isValid: (s) => s.mealTypes.length > 0,
    Component: MealsStep,
  },
  {
    badge: { label: "Tus sabores favoritos", icon: "flag" },
    title: "¿Qué tipo de comida disfrutas más?",
    subtitle: "Puedes elegir varias. Si no eliges ninguna, consideramos todas.",
    isValid: () => true,
    Component: CuisinesStep,
  },
  {
    badge: { label: "Tu salud primero", icon: "shield" },
    title: "Preferencias y alergias",
    subtitle: "Tu salud y tranquilidad son lo primero.",
    isValid: () => true,
    Component: PreferencesStep,
  },
  {
    badge: { label: "Ingredientes", icon: "close" },
    title: "Ingredientes que prefieres evitar",
    subtitle: "Dinos qué no te gusta comer para no incluirlo en ninguna receta de tu plan.",
    isValid: () => true,
    Component: ExcludedStep,
  },
  {
    badge: { label: "Tu alacena inteligente", icon: "kitchen" },
    title: "¿Qué tienes en tu despensa?",
    subtitle: "Marca lo que ya tienes a mano para reducir el costo de tu próxima compra.",
    isValid: () => true,
    Component: PantryStep,
  },
  {
    badge: { label: "Tiendas", icon: "store" },
    title: "¿Dónde sueles hacer el súper?",
    subtitle: "Selecciona una o más tiendas para buscar los mejores precios y organizar tu lista.",
    isValid: (s) => s.storeIds.length > 0,
    Component: StoresStep,
  },
  {
    badge: { label: "Último paso", icon: "tune" },
    title: "¿Qué priorizas esta semana?",
    subtitle: "Elige si prefieres gastar menos o ahorrar tiempo y esfuerzo en tus preparaciones.",
    isValid: () => true,
    Component: SavingsStep,
  },
];
