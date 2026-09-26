// La semana del usuario: el plan activo y su despensa cambian juntos, con acciones atomicas.
// Las reglas viven en packages/planner (funciones puras); aqui solo se orquestan.
// El estado en memoria manda; con Supabase configurado, cada cambio se guarda en segundo plano.
import type { IndexedCatalog, PantryInventory, PlanBundle } from "@zumek/domain";
import { applyPantryUpdate, closePlanIntoPantry, declarePantry } from "@zumek/planner";
import { savePantry, savePlan } from "@zumek/supabase-client";
import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { getSupabase } from "../data/supabase";
import { useCatalog, useSession } from "./catalog";

interface WeekState {
  bundle: PlanBundle | null;
  inventory: PantryInventory[];
}

type WeekAction =
  | { type: "planGenerated"; bundle: PlanBundle; declared: Record<string, number>; at: string }
  | { type: "weekFinished"; at: string };

const pantryRowId = (userId: string) => (canonicalId: string) => `pantry-${userId}-${canonicalId}`;

function weekReducer(catalog: IndexedCatalog) {
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
  /** Ultimo error al guardar en la base (el dato sigue en este dispositivo). */
  syncError: string | null;
}

const WeekContext = createContext<WeekContextValue | null>(null);

export function WeekProvider({ children }: { children: ReactNode }) {
  const catalog = useCatalog();
  const { userId, initialPantry } = useSession();
  const reducer = useMemo(() => weekReducer(catalog), [catalog]);
  const [state, dispatch] = useReducer(reducer, { bundle: null, inventory: initialPantry });
  const [syncError, setSyncError] = useState<string | null>(null);

  // Sincronizacion con Supabase: efectos porque es un sistema externo al estado de React.
  const savedPlanIds = useRef(new Set<string>());
  useEffect(() => {
    const bundle = state.bundle;
    const supabase = getSupabase();
    if (!supabase || !bundle || savedPlanIds.current.has(bundle.plan.id)) return;
    savedPlanIds.current.add(bundle.plan.id);
    savePlan(supabase, bundle)
      .then(() => setSyncError(null))
      .catch((error: Error) => {
        console.error(error);
        setSyncError("No pudimos guardar tu plan en la nube; se conserva en este dispositivo.");
      });
  }, [state.bundle]);

  const loadedInventory = useRef(state.inventory);
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || state.inventory === loadedInventory.current) return;
    savePantry(supabase, userId, state.inventory)
      .then(() => setSyncError(null))
      .catch((error: Error) => {
        console.error(error);
        setSyncError("No pudimos guardar tu despensa en la nube; se conserva en este dispositivo.");
      });
  }, [state.inventory, userId]);

  const value = useMemo<WeekContextValue>(
    () => ({
      ...state,
      planGenerated: (bundle, declared) =>
        dispatch({ type: "planGenerated", bundle, declared, at: new Date().toISOString() }),
      finishWeek: () => dispatch({ type: "weekFinished", at: new Date().toISOString() }),
      syncError,
    }),
    [state, syncError],
  );
  return <WeekContext.Provider value={value}>{children}</WeekContext.Provider>;
}

export function useWeek(): WeekContextValue {
  const ctx = useContext(WeekContext);
  if (!ctx) throw new Error("useWeek fuera de WeekProvider");
  return ctx;
}
