import type { Catalog, PantryInventory, PlanBundle } from "@zumek/domain";
import { applyPantryUpdate, closePlanIntoPantry } from "@zumek/planner";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { LOCAL_USER_ID } from "../data/session";

// Fase 4: la despensa vive en memoria. En Fase 2 se lee y escribe en pantry_inventory (Supabase).
const PantryContext = createContext<{
  inventory: PantryInventory[];
  closePlan: (bundle: PlanBundle, catalog: Catalog) => void;
  replaceWithDeclared: (declared: Record<string, number>, catalog: Catalog) => void;
} | null>(null);

export function PantryProvider({ children }: { children: ReactNode }) {
  const [inventory, setInventory] = useState<PantryInventory[]>([]);

  const closePlan = useCallback((bundle: PlanBundle, catalog: Catalog) => {
    setInventory((current) => {
      const update = closePlanIntoPantry({
        bundle,
        catalog,
        existing: current,
        updatedAt: new Date().toISOString(),
        newId: (canonicalId) => `pantry-${bundle.plan.user_id}-${canonicalId}`,
      });
      return applyPantryUpdate(current, update);
    });
  }, []);

  // Lo que el usuario confirma en "¿Qué tienes en casa?" es la fuente de verdad: viene
  // precargado con el inventario y puede corregirlo (se lo comio, se echo a perder...).
  const replaceWithDeclared = useCallback((declared: Record<string, number>, catalog: Catalog) => {
    setInventory((current) => {
      const now = new Date().toISOString();
      return Object.entries(declared)
        .filter(([, quantity]) => quantity > 0)
        .map(([canonicalId, quantity]) => {
          const previous = current.find((row) => row.canonical_product_id === canonicalId);
          const unit = catalog.canonical_products.find((p) => p.id === canonicalId)?.unit_type ?? "unit";
          return {
            id: previous?.id ?? `pantry-${LOCAL_USER_ID}-${canonicalId}`,
            user_id: LOCAL_USER_ID,
            canonical_product_id: canonicalId,
            remaining_quantity: quantity,
            unit,
            source_plan_id: previous?.source_plan_id ?? "",
            updated_at: previous?.remaining_quantity === quantity ? previous.updated_at : now,
          };
        });
    });
  }, []);

  return (
    <PantryContext.Provider value={{ inventory, closePlan, replaceWithDeclared }}>{children}</PantryContext.Provider>
  );
}

export function usePantry() {
  const ctx = useContext(PantryContext);
  if (!ctx) throw new Error("usePantry fuera de PantryProvider");
  return ctx;
}
