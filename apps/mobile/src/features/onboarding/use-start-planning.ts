import { router } from "expo-router";
import { useOnboarding } from "../../state/onboarding";
import { useWeek } from "../../state/week";

/** Empieza un onboarding nuevo con la despensa ya precargada con lo que sobro. */
export function useStartPlanning() {
  const { dispatch } = useOnboarding();
  const { inventory } = useWeek();
  return () => {
    const pantry = Object.fromEntries(inventory.map((row) => [row.canonical_product_id, row.remaining_quantity]));
    dispatch({ type: "reset", pantry });
    router.push({ pathname: "/onboarding/[step]", params: { step: "1" } });
  };
}
