import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ErrorState, LoadingState } from "../components/AsyncStates";
import { generatePlan } from "../data/plan-source";
import { useCatalog } from "../state/catalog";
import { useOnboarding } from "../state/onboarding";
import { usePlan } from "../state/plan";

export default function Generating() {
  const { state } = useOnboarding();
  const catalog = useCatalog();
  const { setBundle } = usePlan();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setFailed(false);
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    generatePlan(state, catalog)
      .then((bundle) => {
        if (cancelled) return;
        setBundle(bundle);
        router.replace("/plan");
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // Solo se genera al entrar o al reintentar, no en cada cambio de estado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  if (failed) {
    return (
      <ErrorState
        title="No pudimos generar tu plan"
        message="Ocurrió un problema al armar la semana. Tus respuestas siguen guardadas."
        onRetry={retry}
      />
    );
  }
  return <LoadingState message="Buscando la mejor combinación de recetas y precios…" />;
}
