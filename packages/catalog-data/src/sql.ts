// Helpers para generar el SQL de los seeds (precios y recetas).

export function sqlLiteral(value: string | number | null): string {
  if (value === null) return "null";
  if (typeof value === "number") return String(value);
  return `'${value.replace(/'/g, "''")}'`;
}

/** Arreglo de Postgres como literal ('{"a","b"}'): se adapta a text[] o a un enum[]. */
export function pgArray(values: readonly string[]): string {
  return sqlLiteral(`{${values.map((v) => `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",")}}`);
}
