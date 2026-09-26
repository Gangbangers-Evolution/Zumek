import { AppText } from "../../../components/AppText";
import { Badge } from "../../../components/Badge";
import { SelectCard } from "../../../components/SelectCard";
import { useCatalog } from "../../../state/catalog";
import { useOnboarding } from "../../../state/onboarding";

export function StoresStep() {
  const { state, dispatch } = useOnboarding();
  const catalog = useCatalog();
  const selectedCount = state.storeIds.length;
  return (
    <>
      <Badge label="Ahorro inteligente activo" tone="savings" icon="savings" />
      {catalog.stores
        .filter((s) => s.active)
        .map((store) => (
          <SelectCard
            key={store.id}
            title={store.name}
            icon="store"
            selected={state.storeIds.includes(store.id)}
            onPress={() => dispatch({ type: "toggle", field: "storeIds", value: store.id })}
          />
        ))}
      <AppText variant="caption" tone="muted">
        {selectedCount === 0
          ? "Elige al menos una tienda."
          : `Comparamos precios en ${selectedCount} ${selectedCount === 1 ? "tienda" : "tiendas"}. Puedes cambiarlas cuando quieras.`}
      </AppText>
    </>
  );
}
