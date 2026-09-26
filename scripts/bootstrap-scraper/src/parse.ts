// Parser: convierte texto de tienda en numeros concretos (seccion 2: dinero en centavos,
// cantidades en unidad base mass_g | volume_ml | unit).
import { normalizeText } from "@zumek/catalog-data";
import type { UnitType } from "@zumek/domain";

export interface PackageSize {
  quantity: number;
  unit: UnitType;
}

const UNITS: Array<{ pattern: string; unit: UnitType; factor: number }> = [
  { pattern: "kg|kilo|kilos|kilogramos?", unit: "mass_g", factor: 1000 },
  { pattern: "g|gr|grs|gramos?", unit: "mass_g", factor: 1 },
  { pattern: "l|lt|lts|litros?", unit: "volume_ml", factor: 1000 },
  { pattern: "ml|mililitros?", unit: "volume_ml", factor: 1 },
  { pattern: "pzas?|piezas?|pz|pzs|un|unidades?", unit: "unit", factor: 1 },
];

const NUMBER = "(\\d+(?:[.,]\\d+)?)";

function toNumber(text: string): number {
  return Number(text.replace(",", "."));
}

/**
 * "Pechuga Bachoco 900 g" -> 900 mass_g; "Leche 1 L" -> 1000 volume_ml;
 * "Refresco 6 x 355 ml" -> 2130 volume_ml; "Huevo 18 pzas" -> 18 unit.
 * Si no reconoce un tamano regresa null (el validador lo manda a revision humana).
 */
export function parsePackageSize(label: string): PackageSize | null {
  const text = normalizeText(label);
  for (const { pattern, unit, factor } of UNITS) {
    const multi = new RegExp(`(\\d+)\\s*(?:x|/)\\s*${NUMBER}\\s*(?:${pattern})\\b`).exec(text);
    if (multi) return { quantity: round(Number(multi[1]) * toNumber(multi[2]!) * factor), unit };
    const single = new RegExp(`${NUMBER}\\s*(?:${pattern})\\b`).exec(text);
    if (single) return { quantity: round(toNumber(single[1]!) * factor), unit };
  }
  return null;
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** "$1,234.50", "1234.5", 1234.5 -> 123450. Nunca regresa float. null si no es un precio. */
export function priceToCents(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? Math.round(value * 100) : null;
  }
  if (typeof value !== "string") return null;
  const clean = value.replace(/[^\d.,]/g, "");
  // "1,234.50" -> miles con coma; "12,50" -> decimal con coma
  const normalized = /,\d{2}$/.test(clean) && !clean.includes(".") ? clean.replace(",", ".") : clean.replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized) * 100);
  return cents > 0 ? cents : null;
}
