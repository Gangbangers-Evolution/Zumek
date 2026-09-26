// Tiendas del MVP. Verificacion del 2026-09-26 con `--check` (navegador automatizado):
// - Alsuper: /buscar?q= redirige al inicio -> URL de busqueda por confirmar; usar --manual.
// - Walmart: responde /blocked a navegadores automatizados -> usar --manual.
// - Soriana: bloqueo de Cloudflare -> usar --manual.
// Si alguien confirma la URL de busqueda real de una tienda, se corrige aqui.
export interface StoreConfig {
  slug: string;
  name: string;
  searchUrl: (term: string) => string;
}

export const STORES: StoreConfig[] = [
  {
    slug: "alsuper",
    name: "Alsuper",
    searchUrl: (term) => `https://www.alsuper.com/buscar?q=${encodeURIComponent(term)}`,
  },
  {
    slug: "walmart",
    name: "Walmart",
    searchUrl: (term) => `https://super.walmart.com.mx/search?q=${encodeURIComponent(term)}`,
  },
  {
    slug: "soriana",
    name: "Soriana",
    searchUrl: (term) => `https://www.soriana.com/buscar?q=${encodeURIComponent(term)}`,
  },
];
