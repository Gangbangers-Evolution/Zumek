// Dinero siempre en centavos enteros; el formato solo existe en la UI.

function groupThousands(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatCents(cents: number): string {
  const abs = Math.abs(cents);
  const pesos = Math.floor(abs / 100);
  const rest = String(abs % 100).padStart(2, "0");
  return `${cents < 0 ? "-" : ""}$${groupThousands(pesos)}.${rest} MXN`;
}

export function formatDeltaCents(cents: number): string {
  return cents > 0 ? `+${formatCents(cents)}` : formatCents(cents);
}

/** "900", "900.5", "1,250.75" -> centavos. null si no es un monto valido. */
export function parsePesosToCents(input: string): number | null {
  const clean = input.replace(/[,\s$]/g, "");
  const match = /^(\d{1,7})(?:\.(\d{0,2}))?$/.exec(clean);
  if (!match) return null;
  const pesos = Number(match[1]);
  const cents = Number((match[2] ?? "").padEnd(2, "0"));
  return pesos * 100 + cents;
}

export function centsToPesosInput(cents: number): string {
  const rest = cents % 100;
  return rest === 0 ? String(cents / 100) : `${Math.floor(cents / 100)}.${String(rest).padStart(2, "0")}`;
}
