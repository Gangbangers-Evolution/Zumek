import type { Catalog } from "@zumek/domain";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { loadCatalog } from "../data/catalog-source";

type CatalogState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; catalog: Catalog };

interface CatalogContextValue {
  state: CatalogState;
  retry: () => void;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CatalogState>({ status: "loading" });

  // El estado solo cambia cuando la peticion responde; "cargando" es el estado inicial
  // y el reintento lo vuelve a poner desde el boton (un evento, no un efecto).
  const fetchCatalog = useCallback(() => {
    loadCatalog()
      .then((catalog) => setState({ status: "ready", catalog }))
      .catch(() => setState({ status: "error" }));
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    fetchCatalog();
  }, [fetchCatalog]);

  return <CatalogContext.Provider value={{ state, retry }}>{children}</CatalogContext.Provider>;
}

export function useCatalogState(): CatalogContextValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalogState fuera de CatalogProvider");
  return ctx;
}

/** Solo para pantallas detras de la compuerta de carga: el catalogo ya existe. */
export function useCatalog(): Catalog {
  const { state } = useCatalogState();
  if (state.status !== "ready") throw new Error("catalogo no cargado");
  return state.catalog;
}
