// Parser -> validator -> normalizer -> canonical matcher. Lee lo crudo de out/raw/*.json
// y genera out/review.csv para revision humana (Sheets o LibreOffice).
// La persona cambia la columna "incluir" a si/no y corrige lo que haga falta.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { loadCanonicalProducts, type CanonicalSpec } from "./catalog";
import { toCsv } from "./csv";
import { matchCanonical } from "./match";
import { parsePackageSize, priceToCents } from "./parse";
import type { RawRecord } from "./scrape";
import { STORES } from "./stores";

export const REVIEW_COLUMNS = [
  "incluir",
  "estado",
  "motivo",
  "tienda",
  "producto_canonico",
  "nombre_en_tienda",
  "marca",
  "cantidad_paquete",
  "unidad",
  "precio_centavos",
  "precio_mxn",
  "url",
  "fuente",
  "capturado",
];

// Rango sano para un producto de super: fuera de esto casi seguro es un error de lectura
const MIN_CENTS = 500;
const MAX_CENTS = 300_000;

export function reviewRecord(record: RawRecord, canonical: CanonicalSpec) {
  return record.products.map((product) => {
    const size = parsePackageSize(product.name);
    const cents = priceToCents(product.price);
    const match = matchCanonical(product.name, size, canonical);
    const issues: string[] = [];
    if (!size) issues.push("no se reconoce el tamano del paquete");
    if (cents === null) issues.push(`precio ilegible (${String(product.price)})`);
    else if (cents < MIN_CENTS || cents > MAX_CENTS) issues.push("precio fuera de rango, revisar si viene en centavos");

    const estado = !match.ok ? "descartado" : issues.length > 0 ? "revisar" : "ok";
    return {
      incluir: estado === "ok" ? "si" : "no",
      estado,
      motivo: match.ok ? issues.join("; ") : match.reason,
      tienda: record.store,
      producto_canonico: canonical.name,
      nombre_en_tienda: product.name,
      marca: product.brand,
      cantidad_paquete: size?.quantity ?? null,
      unidad: size?.unit ?? null,
      precio_centavos: cents,
      precio_mxn: cents === null ? null : (cents / 100).toFixed(2),
      url: product.url,
      fuente: product.source,
      capturado: record.captured_at,
    };
  });
}

function main() {
  const rawDir = new URL("../out/raw/", import.meta.url).pathname;
  if (!existsSync(rawDir)) throw new Error("No hay datos crudos. Corre primero: pnpm scrape");
  const canonicals = new Map(loadCanonicalProducts().map((c) => [c.name, c]));

  const rows = readdirSync(rawDir)
    .filter((f) => f.endsWith(".json") && !f.includes(".check"))
    .flatMap((file) => JSON.parse(readFileSync(rawDir + file, "utf8")) as RawRecord[])
    .flatMap((record) => {
      const canonical = canonicals.get(record.canonical);
      return canonical ? reviewRecord(record, canonical) : [];
    });

  const order = { ok: 0, revisar: 1, descartado: 2 } as Record<string, number>;
  rows.sort(
    (a, b) =>
      a.producto_canonico.localeCompare(b.producto_canonico) ||
      a.tienda.localeCompare(b.tienda) ||
      order[a.estado]! - order[b.estado]!,
  );

  const outFile = new URL("../out/review.csv", import.meta.url).pathname;
  writeFileSync(outFile, "\uFEFF" + toCsv(rows, REVIEW_COLUMNS)); // BOM: Excel/Sheets leen bien los acentos
  const count = (estado: string) => rows.filter((r) => r.estado === estado).length;
  console.log(`${rows.length} candidatos: ${count("ok")} ok, ${count("revisar")} por revisar, ${count("descartado")} descartados`);

  // Cobertura: cada producto canonico deberia tener al menos una opcion por tienda
  const missing: string[] = [];
  for (const canonical of canonicals.values()) {
    for (const store of STORES) {
      if (!rows.some((r) => r.tienda === store.slug && r.producto_canonico === canonical.name && r.estado === "ok")) {
        missing.push(`${canonical.name} @ ${store.name}`);
      }
    }
  }
  if (missing.length) console.warn(`Sin opcion "ok" (revisar a mano):\n  ${missing.join("\n  ")}`);
  console.log(`\nRevisa ${outFile}: pon "si" en incluir solo lo correcto. Despues: pnpm seed`);
}

if (process.argv[1]?.endsWith("review.ts")) main();
