import { useMemo, useState } from "react";
import { useCatalog } from "../../../state/catalog";

/** Busqueda de productos canonicos por nombre (ingredientes a evitar y despensa). */
export function useProductSearch() {
  const catalog = useCatalog();
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.canonical_products.filter((p) => p.name.toLowerCase().includes(q));
  }, [catalog, query]);
  return { query, setQuery, results };
}
