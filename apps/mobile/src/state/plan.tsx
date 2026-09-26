import type { PlanBundle } from "@zumek/domain";
import { createContext, useContext, useState, type ReactNode } from "react";

const PlanContext = createContext<{
  bundle: PlanBundle | null;
  setBundle: (bundle: PlanBundle | null) => void;
} | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [bundle, setBundle] = useState<PlanBundle | null>(null);
  return <PlanContext.Provider value={{ bundle, setBundle }}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan fuera de PlanProvider");
  return ctx;
}
