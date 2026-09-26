// Carga inicial de la app (seccion 5: un solo fetch al abrir, guardado en memoria).
import { buildSampleCatalog } from "@zumek/catalog-data";
import type { Catalog, PantryInventory } from "@zumek/domain";
import { ensureGuestSession, loadCatalog, loadPantry } from "@zumek/supabase-client";
import { getSupabase } from "./supabase";

export interface AppData {
  catalog: Catalog;
  /** auth.uid() del invitado; "local-user" sin Supabase configurado. */
  userId: string;
  /** Despensa guardada del usuario (vacia sin Supabase). */
  pantry: PantryInventory[];
}

export async function loadAppData(): Promise<AppData> {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn("Supabase no configurado (apps/mobile/.env): usando el catalogo de ejemplo sin guardar datos.");
    return { catalog: buildSampleCatalog(), userId: "local-user", pantry: [] };
  }
  const userId = await ensureGuestSession(supabase);
  const [catalog, pantry] = await Promise.all([loadCatalog(supabase), loadPantry(supabase)]);
  return { catalog, userId, pantry };
}
