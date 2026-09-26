// Canonical matcher: decide si un producto de tienda corresponde al producto conceptual
// que se busco. Nunca adivina: si hay duda, el candidato va a revision humana.
import type { PackageSize } from "./parse";
import { normalizeText, type CanonicalProductSpec } from "@zumek/catalog-data";

export type MatchResult = { ok: true } | { ok: false; reason: string };

export function matchCanonical(productName: string, size: PackageSize | null, canonical: CanonicalProductSpec): MatchResult {
  const name = normalizeText(productName);
  const missing = canonical.require.filter((word) => !name.includes(normalizeText(word)));
  if (missing.length > 0) return { ok: false, reason: `no menciona: ${missing.join(", ")}` };
  const excluded = canonical.exclude.find((word) => name.includes(normalizeText(word)));
  if (excluded) return { ok: false, reason: `contiene "${excluded}"` };
  if (size && size.unit !== canonical.unit_type) {
    return { ok: false, reason: `unidad ${size.unit} distinta de ${canonical.unit_type}` };
  }
  return { ok: true };
}
