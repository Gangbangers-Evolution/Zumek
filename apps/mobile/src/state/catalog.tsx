import { indexCatalog, type IndexedCatalog, type PantryInventory } from "@zumek/domain";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { loadAppData } from "../data/catalog-source";

interface Ready {
  status: "ready";
  catalog: IndexedCatalog;
  userId: string;
  initialPantry: PantryInventory[];
}

type CatalogState = { status: "loading" } | { status: "error" } | Ready;

interface CatalogContextValue {
  state: CatalogState;
  retry: () => void;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CatalogState>({ status: "loading" });

  // El estado solo cambia cuando la peticion responde; "cargando" es el estado inicial
  // y el reintento lo vuelve a poner desde el boton (un evento, no un efecto).
  const fetchData = useCallback(() => {
    loadAppData()
      .then(({ catalog, userId, pantry }) =>
        setState({ status: "ready", catalog: indexCatalog(catalog), userId, initialPantry: pantry }),
      )
      .catch((error: unknown) => {
        console.error(error);
        setState({ status: "error" });
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    fetchData();
  }, [fetchData]);

  return <CatalogContext.Provider value={{ state, retry }}>{children}</CatalogContext.Provider>;
}

export function useCatalogState(): CatalogContextValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalogState fuera de CatalogProvider");
  return ctx;
}

/** Solo para pantallas detras de la compuerta de carga: los datos ya existen. */
function useReady(): Ready {
  const { state } = useCatalogState();
  if (state.status !== "ready") throw new Error("datos iniciales no cargados");
  return state;
}

export function useCatalog(): IndexedCatalog {
  return useReady().catalog;
}

/** Datos de la sesion: usuario (auth.uid()) y la despensa que tenia guardada al abrir. */
export function useSession(): { userId: string; initialPantry: PantryInventory[] } {
  const { userId, initialPantry } = useReady();
  return { userId, initialPantry };
}
