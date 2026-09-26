// La semana del usuario: el plan activo y su despensa cambian juntos, con acciones atomicas.
// Las reglas viven en packages/planner (funciones puras); aqui solo se orquestan.
// Hasta la Fase 2 vive en memoria; despues estas mismas acciones escriben en Supabase.
import type { Catalog, PantryInventory, PlanBundle } from "@zumek/domain";
import { applyPantryUpdate, closePlanIntoPantry, declarePantry } from "@zumek/planner";
import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import { useCatalog } from "./catalog";

interface WeekState {
  bundle: PlanBundle | null;
  inventory: PantryInventory[];
}

type WeekAction =
  | { type: "planGenerated"; bundle: PlanBundle; declared: Record<string, number>; at: string }
  | { type: "weekFinished"; at: string };

const pantryRowId = (userId: string) => (canonicalId: string) => `pantry-${userId}-${canonicalId}`;

function weekReducer(catalog: Catalog) {
  return (state: WeekState, action: WeekAction): WeekState => {
    switch (action.type) {
      case "planGenerated": {
        const userId = action.bundle.plan.user_id;
        return {
          bundle: action.bundle,
          inventory: declarePantry({
            declared: action.declared,
            existing: state.inventory,
            userId,
            catalog,
            updatedAt: action.at,
            newId: pantryRowId(userId),
          }),
        };
      }
      case "weekFinished": {
        if (!state.bundle) return state;
        const update = closePlanIntoPantry({
          bundle: state.bundle,
          catalog,
          existing: state.inventory,
          updatedAt: action.at,
          newId: pantryRowId(state.bundle.plan.user_id),
        });
        return { bundle: null, inventory: applyPantryUpdate(state.inventory, update) };
      }
    }
  };
}

interface WeekContextValue extends WeekState {
  /** Guarda el plan nuevo y lo que el usuario declaro tener en casa, en un solo paso. */
  planGenerated: (bundle: PlanBundle, declared: Record<string, number>) => void;
  /** Cierra el plan activo: los sobrantes se suman a la despensa y ya no hay plan activo. */
  finishWeek: () => void;
}

const WeekContext = createContext<WeekContextValue | null>(null);

export function WeekProvider({ children }: { children: ReactNode }) {
  const catalog = useCatalog();
  const reducer = useMemo(() => weekReducer(catalog), [catalog]);
  const [state, dispatch] = useReducer(reducer, { bundle: null, inventory: [] });

  const value = useMemo<WeekContextValue>(
    () => ({
      ...state,
      planGenerated: (bundle, declared) =>
        dispatch({ type: "planGenerated", bundle, declared, at: new Date().toISOString() }),
      finishWeek: () => dispatch({ type: "weekFinished", at: new Date().toISOString() }),
    }),
    [state],
  );
  return <WeekContext.Provider value={value}>{children}</WeekContext.Provider>;
}

export function useWeek(): WeekContextValue {
  const ctx = useContext(WeekContext);
  if (!ctx) throw new Error("useWeek fuera de WeekProvider");
  return ctx;
}
