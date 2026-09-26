// Convierte out/review.csv YA REVISADO (incluir = si) en SQL para Supabase.
// Usa llaves naturales (slug de tienda, nombre de producto) para no depender de como
// la migracion genere los ids. Es idempotente: correrlo dos veces no duplica filas.
import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { loadCanonicalProducts } from "./catalog";
import { parseCsv } from "./csv";
import { STORES } from "./stores";

const UNITS = new Set(["mass_g", "volume_ml", "unit"]);

function sql(value: string | number | null): string {
  if (value === null || value === "") return "null";
  if (typeof value === "number") return String(value);
  return `'${value.replace(/'/g, "''")}'`;
}

export function buildSeedSql(rows: Array<Record<string, string>>): { sql: string; errors: string[] } {
  const canonicals = new Map(loadCanonicalProducts().map((c) => [c.name, c]));
  const stores = new Map(STORES.map((s) => [s.slug, s]));
  const errors: string[] = [];
  const included = rows.filter((r) => r.incluir?.trim().toLowerCase() === "si");

  included.forEach((row, i) => {
    const line = `fila ${i + 1} (${row.nombre_en_tienda})`;
    const canonical = canonicals.get(row.producto_canonico ?? "");
    if (!canonical) errors.push(`${line}: producto_canonico desconocido "${row.producto_canonico}"`);
    if (!stores.has(row.tienda ?? "")) errors.push(`${line}: tienda desconocida "${row.tienda}"`);
    if (!UNITS.has(row.unidad ?? "")) errors.push(`${line}: unidad invalida "${row.unidad}"`);
    else if (canonical && row.unidad !== canonical.unit_type) errors.push(`${line}: unidad ${row.unidad} no coincide con ${canonical.unit_type}`);
    if (!(Number(row.cantidad_paquete) > 0)) errors.push(`${line}: cantidad_paquete invalida`);
    if (!/^\d+$/.test(row.precio_centavos ?? "") || Number(row.precio_centavos) <= 0) {
      errors.push(`${line}: precio_centavos debe ser entero positivo (dinero nunca en float)`);
    }
  });
  if (errors.length) return { sql: "", errors };

  const out: string[] = [
    "-- Generado por scripts/bootstrap-scraper (pnpm seed) a partir de review.csv revisado.",
    "-- No editar a mano: corregir el CSV y volver a generar.",
    "begin;",
    "",
    "-- Tiendas",
  ];
  for (const store of STORES) {
    out.push(
      `insert into store (name, slug, active) select ${sql(store.name)}, ${sql(store.slug)}, true where not exists (select 1 from store where slug = ${sql(store.slug)});`,
    );
  }

  out.push("", "-- Productos canonicos");
  for (const c of new Set(included.map((r) => r.producto_canonico!))) {
    const spec = canonicals.get(c)!;
    out.push(
      `insert into canonical_product (name, unit_type, category) select ${sql(spec.name)}, ${sql(spec.unit_type)}, ${sql(spec.category)} where not exists (select 1 from canonical_product where name = ${sql(spec.name)});`,
    );
  }

  out.push("", "-- Productos de tienda y su precio observado (price_observation es solo INSERT)");
  for (const row of included) {
    const where = `s.slug = ${sql(row.tienda!)} and cp.package_label = ${sql(row.nombre_en_tienda!)}`;
    out.push(
      `insert into commercial_product (canonical_product_id, store_id, brand, package_label, package_quantity, package_unit) ` +
        `select c.id, s.id, ${sql(row.marca || null)}, ${sql(row.nombre_en_tienda!)}, ${Number(row.cantidad_paquete)}, ${sql(row.unidad!)} ` +
        `from canonical_product c, store s where c.name = ${sql(row.producto_canonico!)} and s.slug = ${sql(row.tienda!)} ` +
        `and not exists (select 1 from commercial_product cp where cp.store_id = s.id and cp.package_label = ${sql(row.nombre_en_tienda!)});`,
      `insert into price_observation (commercial_product_id, price_cents, observed_at) ` +
        `select cp.id, ${Number(row.precio_centavos)}, ${sql(row.capturado!)} from commercial_product cp join store s on s.id = cp.store_id where ${where} ` +
        `and not exists (select 1 from price_observation po where po.commercial_product_id = cp.id and po.observed_at = ${sql(row.capturado!)});`,
    );
  }
  out.push("", "commit;", "");
  return { sql: out.join("\n"), errors };
}

function main() {
  const { values } = parseArgs({ options: { file: { type: "string" } } });
  const file = values.file ?? new URL("../out/review.csv", import.meta.url).pathname;
  const { sql: text, errors } = buildSeedSql(parseCsv(readFileSync(file, "utf8")));
  if (errors.length) {
    console.error(`El CSV tiene ${errors.length} error(es); no se genero SQL:\n  ${errors.join("\n  ")}`);
    process.exit(1);
  }
  const outFile = new URL("../out/seed-products.sql", import.meta.url).pathname;
  writeFileSync(outFile, text);
  console.log(`SQL listo: ${outFile}\nPasalo a quien lleva Supabase para incluirlo en supabase/seed.sql.`);
}

if (process.argv[1]?.endsWith("seed.ts")) main();
