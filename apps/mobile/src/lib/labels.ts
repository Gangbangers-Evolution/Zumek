import type { MealType, PlanStatus } from "@zumek/domain";

export const MEAL_TYPES: MealType[] = ["desayuno", "comida", "cena", "snack"];

export const MEAL_TYPE_LABEL: Record<MealType, string> = {
  desayuno: "Desayuno",
  comida: "Comida",
  cena: "Cena",
  snack: "Snack",
};

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function dayLabel(dayIndex: number): string {
  return `Día ${dayIndex + 1}`;
}

export const STATUS_COPY: Record<PlanStatus, { title: string; body: string }> = {
  ok: {
    title: "Tu plan cabe en tu presupuesto",
    body: "Armamos la semana reutilizando ingredientes para que compres lo menos posible.",
  },
  over_budget_close: {
    title: "Te pasas un poco del presupuesto",
    body: "Es lo más cerca que pudimos llegar. Puedes subir un poco el presupuesto o relajar alguna preferencia.",
  },
  infeasible_likely: {
    title: "No encontramos un plan viable con estas condiciones",
    body: "Prueba con un presupuesto mayor, menos comidas por día o más tiendas.",
  },
};
