import { EmptyState } from "../../components/AsyncStates";
import { useStartPlanning } from "./use-start-planning";

/** Para pantallas que necesitan un plan activo (plan, lista de compras) cuando no lo hay. */
export function NoActivePlan() {
  const startPlanning = useStartPlanning();
  return (
    <EmptyState
      title="No tienes un plan activo"
      message="Arma tu semana para ver tu menú y tu lista de compras."
      actionLabel="Armar mi semana"
      onAction={startPlanning}
    />
  );
}
