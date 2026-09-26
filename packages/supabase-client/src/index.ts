// Unica puerta de la app hacia Supabase: sesion de invitado, catalogo y datos del usuario.
// Las columnas coinciden 1:1 con los tipos de @zumek/domain (mismos nombres snake_case).
import { createClient, type SupabaseClient, type SupportedStorage } from "@supabase/supabase-js";
import type {
  CanonicalProduct,
  Catalog,
  ColloquialUnit,
  CommercialProduct,
  PantryInventory,
  PlanBundle,
  PriceObservation,
  Recipe,
  RecipeIngredient,
  RecipeStep,
  Store,
} from "@zumek/domain";

export type ZumekClient = SupabaseClient;

export function createZumekClient(url: string, publishableKey: string, storage?: SupportedStorage): ZumekClient {
  return createClient(url, publishableKey, {
    auth: { storage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
}

/** Reusa la sesion guardada o entra como invitado (Anonymous Auth). Regresa auth.uid(). */
export async function ensureGuestSession(client: ZumekClient): Promise<string> {
  const { data } = await client.auth.getSession();
  if (data.session) return data.session.user.id;
  const { data: signIn, error } = await client.auth.signInAnonymously();
  if (error || !signIn.user) throw new Error(`No se pudo iniciar sesion como invitado: ${error?.message ?? "sin usuario"}`);
  return signIn.user.id;
}

async function selectAll<T>(client: ZumekClient, table: string, columns: string): Promise<T[]> {
  const { data, error } = await client.from(table).select(columns);
  if (error) throw new Error(`Supabase ${table}: ${error.message}`);
  return data as T[];
}

/** El catalogo completo en un solo viaje (seccion 5: fetch-then-cache). */
export async function loadCatalog(client: ZumekClient): Promise<Catalog> {
  const [stores, canonical_products, commercial_products, latest_prices, colloquial_units, recipes, recipe_steps, recipe_ingredients] =
    await Promise.all([
      selectAll<Store>(client, "store", "id, name, slug, active"),
      selectAll<CanonicalProduct>(client, "canonical_product", "id, name, unit_type, category, allergens"),
      selectAll<CommercialProduct>(client, "commercial_product", "id, canonical_product_id, store_id, brand, package_label, package_quantity, package_unit"),
      selectAll<PriceObservation>(client, "latest_price", "id, commercial_product_id, price_cents, observed_at"),
      selectAll<ColloquialUnit>(client, "colloquial_unit", "term, base_quantity, base_unit"),
      selectAll<Recipe>(client, "recipe", "id, name, cuisine, meal_type, tags, prep_time_minutes, servings_base, allergens"),
      selectAll<RecipeStep>(client, "recipe_step", "id, recipe_id, step_order, title, content, timer_seconds"),
      selectAll<RecipeIngredient>(client, "recipe_ingredient", "id, recipe_id, canonical_product_id, quantity, unit"),
    ]);
  return { stores, canonical_products, commercial_products, latest_prices, colloquial_units, recipes, recipe_steps, recipe_ingredients };
}

/** Guarda un plan generado con sus comidas y su lista de compras (el precio va como snapshot). */
export async function savePlan(client: ZumekClient, bundle: PlanBundle): Promise<void> {
  const { error } = await client.from("plan").insert(bundle.plan);
  if (error) throw new Error(`Supabase plan: ${error.message}`);
  const children = await Promise.all([
    bundle.meals.length ? client.from("plan_meal").insert(bundle.meals) : Promise.resolve({ error: null }),
    bundle.shopping_items.length ? client.from("plan_shopping_item").insert(bundle.shopping_items) : Promise.resolve({ error: null }),
  ]);
  const failed = children.find((r) => r.error);
  if (failed?.error) throw new Error(`Supabase detalle del plan: ${failed.error.message}`);
}

export async function loadPantry(client: ZumekClient): Promise<PantryInventory[]> {
  return selectAll<PantryInventory>(client, "pantry_inventory", "id, user_id, canonical_product_id, remaining_quantity, unit, source_plan_id, updated_at");
}

/**
 * Deja la despensa del usuario en la base igual que `rows` (ya calculada por el planner):
 * escribe cada fila y borra los ingredientes que ya no estan.
 */
export async function savePantry(client: ZumekClient, userId: string, rows: PantryInventory[]): Promise<void> {
  const mine = rows.filter((r) => r.user_id === userId);
  if (mine.length > 0) {
    const { error } = await client.from("pantry_inventory").upsert(mine, { onConflict: "user_id,canonical_product_id" });
    if (error) throw new Error(`Supabase despensa: ${error.message}`);
  }
  let remove = client.from("pantry_inventory").delete().eq("user_id", userId);
  if (mine.length > 0) remove = remove.not("canonical_product_id", "in", `(${mine.map((r) => `"${r.canonical_product_id}"`).join(",")})`);
  const { error } = await remove;
  if (error) throw new Error(`Supabase despensa (borrar): ${error.message}`);
}

export { askChat, ChatError, type ChatErrorCode, type ChatProposal, type ChatReply, type ChatRequest, type ChatTurn } from "./chat";
