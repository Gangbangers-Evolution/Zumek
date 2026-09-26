// Cliente de Supabase de la app. Las variables EXPO_PUBLIC_* van dentro del bundle (son
// publicas por diseno; RLS protege los datos). Sin ellas la app corre con el catalogo de ejemplo.
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createZumekClient, type ZumekClient } from "@zumek/supabase-client";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

let client: ZumekClient | null = null;

/**
 * Se crea al primer uso y no al importar: en web, Expo pre-renderiza en el servidor (sin
 * `window`) y el cliente intenta leer la sesion guardada en cuanto existe. Solo se llama desde
 * efectos y callbacks, que corren en el dispositivo o el navegador.
 * null si la app no tiene Supabase configurado.
 */
export function getSupabase(): ZumekClient | null {
  if (!url || !key) return null;
  // La sesion del invitado se guarda en el dispositivo para que siga siendo el mismo usuario.
  client ??= createZumekClient(url, key, AsyncStorage);
  return client;
}
