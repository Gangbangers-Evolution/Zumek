import type { ColloquialUnit, UnitType } from "@zumek/domain";

const UNIT_SUFFIX: Record<UnitType, string> = {
  mass_g: "g",
  volume_ml: "ml",
  unit: "pzas",
};

export function unitLabel(unit: UnitType): string {
  return UNIT_SUFFIX[unit];
}

function round(value: number): string {
  return String(Math.round(value * 100) / 100);
}

export function formatQuantity(quantity: number, unit: UnitType): string {
  if (unit === "unit") return `${round(quantity)} ${quantity <= 1 ? "pza" : "pzas"}`;
  if (quantity >= 1000) return `${round(quantity / 1000)} ${unit === "mass_g" ? "kg" : "L"}`;
  return `${round(quantity)} ${UNIT_SUFFIX[unit]}`;
}

/**
 * 'pizca de sal (1 g)': si la cantidad es un multiplo exacto (1-4) de un termino coloquial,
 * lo antepone. Solo presentacion; el planner nunca usa esto.
 */
export function formatWithColloquial(
  quantity: number,
  unit: UnitType,
  colloquialUnits: ColloquialUnit[],
): string {
  const base = formatQuantity(quantity, unit);
  const candidates = colloquialUnits
    .filter((c) => c.base_unit === unit)
    .sort((a, b) => b.base_quantity - a.base_quantity);
  for (const c of candidates) {
    const times = quantity / c.base_quantity;
    if (Number.isInteger(times) && times >= 1 && times <= 4) {
      const term = `${times} ${times === 1 ? c.term : `${c.term}s`}`;
      return `${term} (${base})`;
    }
  }
  return base;
}
