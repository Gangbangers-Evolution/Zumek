// La semana del usuario: el plan activo y su despensa cambian juntos, con acciones atomicas.
// Las reglas viven en packages/planner (funciones puras); aqui solo se orquestan.
// El estado en memoria manda; con Supabase configurado, cada cambio se guarda en segundo plano.
import type { IndexedCatalog, PantryInventory, PlanBundle } from "@zumek/domain";
import { applyPantryUpdate, closePlanIntoPantry, declarePantry } from "@zumek/planner";
import { savePantry, savePlan } from "@zumek/supabase-client";
import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import type { ActivePlan } from "../data/plan-source";
import { getSupabase } from "../data/supabase";
import { useCatalog, useSession } from "./catalog";

interface WeekState {
  active: ActivePlan | null;
  inventory: PantryInventory[];
}

type WeekAction =
  | { type: "planGenerated"; plan: ActivePlan; declared: Record<string, number>; at: string }
  | { type: "planChanged"; plan: ActivePlan }
  | { type: "weekFinished"; at: string };

const pantryRowId = (userId: string) => (canonicalId: string) => `pantry-${userId}-${canonicalId}`;

function weekReducer(catalog: IndexedCatalog) {
  return (state: WeekState, action: WeekAction): WeekState => {
    switch (action.type) {
      case "planGenerated": {
        const userId = action.plan.bundle.plan.user_id;
        return {
          active: action.plan,
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
      // Un cambio confirmado en el chat reemplaza el plan; la despensa declarada no cambia.
      case "planChanged":
        return state.active ? { ...state, active: action.plan } : state;
      case "weekFinished": {
        if (!state.active) return state;
        const { bundle, substitutions } = state.active;
        const update = closePlanIntoPantry({
          bundle,
          catalog,
          substitutions,
          existing: state.inventory,
          updatedAt: action.at,
          newId: pantryRowId(bundle.plan.user_id),
        });
        return { active: null, inventory: applyPantryUpdate(state.inventory, update) };
      }
    }
  };
}

interface WeekContextValue extends WeekState {
  /** Atajo a active.bundle: casi todas las pantallas solo leen el plan. */
  bundle: PlanBundle | null;
  /** Guarda el plan nuevo y lo que el usuario declaro tener en casa, en un solo paso. */
  planGenerated: (plan: ActivePlan, declared: Record<string, number>) => void;
  /** Reemplaza el plan activo por uno recalculado (cambio confirmado en el chat). */
  planChanged: (plan: ActivePlan) => void;
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
  const [state, dispatch] = useReducer(reducer, { active: null, inventory: initialPantry });
  const [syncError, setSyncError] = useState<string | null>(null);

  // Sincronizacion con Supabase: efectos porque es un sistema externo al estado de React.
  const savedPlanIds = useRef(new Set<string>());
  // Cada plan (tambien los cambios del chat, que traen id nuevo) se guarda una sola vez.
  const bundle = state.active?.bundle ?? null;
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !bundle || savedPlanIds.current.has(bundle.plan.id)) return;
    savedPlanIds.current.add(bundle.plan.id);
    savePlan(supabase, bundle)
      .then(() => setSyncError(null))
      .catch((error: Error) => {
        console.error(error);
        setSyncError("No pudimos guardar tu plan en la nube; se conserva en este dispositivo.");
      });
  }, [bundle]);

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
      bundle,
      planGenerated: (plan, declared) => dispatch({ type: "planGenerated", plan, declared, at: new Date().toISOString() }),
      planChanged: (plan) => dispatch({ type: "planChanged", plan }),
      finishWeek: () => dispatch({ type: "weekFinished", at: new Date().toISOString() }),
      syncError,
    }),
    [state, bundle, syncError],
  );
  return <WeekContext.Provider value={value}>{children}</WeekContext.Provider>;
}

export function useWeek(): WeekContextValue {
  const ctx = useContext(WeekContext);
  if (!ctx) throw new Error("useWeek fuera de WeekProvider");
  return ctx;
}
