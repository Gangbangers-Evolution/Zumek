// Tiendas del MVP. Verificacion del 2026-09-26 con `--check` (navegador automatizado):
// - Alsuper: /buscar?q= redirige al inicio -> URL de busqueda por confirmar; usar --manual.
// - Walmart: responde /blocked a navegadores automatizados -> usar --manual.
// - Soriana: bloqueo de Cloudflare -> usar --manual.
// Si alguien confirma la URL de busqueda real de una tienda, se corrige aqui.
import { STORES, type StoreSpec } from "@zumek/catalog-data";

export interface StoreConfig extends StoreSpec {
  searchUrl: (term: string) => string;
}

// Las tiendas (slug y nombre) vienen de catalog-data; aqui solo se agrega como buscar en cada una.
const SEARCH_URLS: Record<string, (term: string) => string> = {
  alsuper: (term) => `https://www.alsuper.com/buscar?q=${encodeURIComponent(term)}`,
  walmart: (term) => `https://super.walmart.com.mx/search?q=${encodeURIComponent(term)}`,
  soriana: (term) => `https://www.soriana.com/buscar?q=${encodeURIComponent(term)}`,
};

export const SCRAPE_STORES: StoreConfig[] = STORES.map((store) => {
  const searchUrl = SEARCH_URLS[store.slug];
  if (!searchUrl) throw new Error(`Falta la URL de busqueda para la tienda "${store.slug}" en stores.ts`);
  return { ...store, searchUrl };
});
