// Extractor generico: encuentra objetos "tipo producto" (nombre + precio) dentro de
// cualquier JSON que use la pagina (XHR, JSON-LD, __NEXT_DATA__). Es la via preferida
// de la seccion 8 porque cambia menos que el HTML.

export interface RawProduct {
  name: string;
  brand: string | null;
  /** Precio tal cual venia (numero o texto); el parser lo convierte a centavos. */
  price: unknown;
  url: string | null;
  source: "xhr" | "json-ld" | "next-data" | "manual";
}

const NAME_KEYS = ["productName", "name", "displayName", "title", "description"];
const PRICE_KEYS = ["sellingPrice", "salePrice", "finalPrice", "Price", "price", "priceValue", "currentPrice", "lowPrice"];
const BRAND_KEYS = ["brand", "brandName"];
const URL_KEYS = ["url", "link", "linkText", "productUrl"];

type Json = unknown;

function isObject(value: Json): value is Record<string, Json> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstString(obj: Record<string, Json>, keys: string[]): string | null {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (isObject(value) && typeof value.name === "string") return value.name.trim();
  }
  return null;
}

/** Busca un precio dentro del objeto (hasta 6 niveles), p. ej. items[0].sellers[0].commertialOffer.Price */
function findPrice(value: Json, depth = 0): unknown {
  if (depth > 6) return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findPrice(item, depth + 1);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  if (!isObject(value)) return undefined;
  for (const key of PRICE_KEYS) {
    const candidate = value[key];
    if (typeof candidate === "number" && candidate > 0) return candidate;
    if (typeof candidate === "string" && /\d/.test(candidate)) return candidate;
  }
  for (const key of ["offers", "priceRange", "prices", "items", "sellers", "commertialOffer", "priceInfo"]) {
    if (key in value) {
      const found = findPrice(value[key], depth + 1);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

export function extractProducts(json: Json, source: RawProduct["source"]): RawProduct[] {
  const found: RawProduct[] = [];
  const seen = new Set<string>();
  const visit = (value: Json, depth: number) => {
    if (depth > 12) return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item, depth + 1);
      return;
    }
    if (!isObject(value)) return;

    const name = firstString(value, NAME_KEYS);
    const price = name ? findPrice(value) : undefined;
    if (name && price !== undefined && name.length <= 200) {
      const key = `${name}|${String(price)}`;
      if (!seen.has(key)) {
        seen.add(key);
        found.push({ name, brand: firstString(value, BRAND_KEYS), price, url: firstString(value, URL_KEYS), source });
      }
      return; // un producto no contiene otros productos
    }
    for (const child of Object.values(value)) visit(child, depth + 1);
  };
  visit(json, 0);
  return found;
}
