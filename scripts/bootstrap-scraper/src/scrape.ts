// Bootstrap de precios (Fase 5): UNA corrida supervisada por una persona, con video.
// Playwright -> extractor -> archivo crudo. Nunca escribe en la base de datos.
//
//   pnpm scrape --check                 1 busqueda por tienda para verificar URLs
//   pnpm scrape                          corrida completa (todas las tiendas)
//   pnpm scrape --store walmart          solo una tienda
//   pnpm scrape --store soriana --manual la persona busca y el script captura al presionar Enter
import { mkdirSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";
import { chromium, type Page, type Response } from "playwright";
import { loadCanonicalProducts } from "./catalog";
import { extractProducts, type RawProduct } from "./extract";
import { STORES, type StoreConfig } from "./stores";

const { values: args } = parseArgs({
  options: {
    store: { type: "string" },
    check: { type: "boolean", default: false },
    manual: { type: "boolean", default: false },
    headless: { type: "boolean", default: false },
    // Pausa entre busquedas a la misma tienda: sin paralelismo ni rafagas (seccion 8)
    delay: { type: "string", default: "5000" },
  },
});

const OUT = new URL("../out/", import.meta.url).pathname;
const BLOCK_PATTERN = /attention required|access denied|captcha|are you a robot|verify you are human|blocked|acceso denegado/i;

export interface RawRecord {
  store: string;
  canonical: string;
  term: string;
  page_url: string;
  captured_at: string;
  products: RawProduct[];
}

function resolveUrl(url: string | null, base: string): string | null {
  if (!url) return null;
  try {
    return new URL(url, base).toString();
  } catch {
    return null;
  }
}

async function productsOnPage(page: Page, fromXhr: RawProduct[]): Promise<RawProduct[]> {
  const jsonLd = await page
    .$$eval('script[type="application/ld+json"]', (nodes) => nodes.map((n) => n.textContent ?? ""))
    .catch(() => [] as string[]);
  const nextData = await page.$eval("#__NEXT_DATA__", (n) => n.textContent ?? "").catch(() => "");

  const products = [...fromXhr];
  for (const text of jsonLd) {
    try {
      products.push(...extractProducts(JSON.parse(text), "json-ld"));
    } catch {
      /* JSON-LD invalido: se ignora */
    }
  }
  if (nextData) {
    try {
      products.push(...extractProducts(JSON.parse(nextData), "next-data"));
    } catch {
      /* ignorado */
    }
  }
  const seen = new Set<string>();
  return products
    .map((p) => ({ ...p, url: resolveUrl(p.url, page.url()) }))
    .filter((p) => {
      const key = `${p.name}|${String(p.price)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

async function isBlocked(page: Page, response: Response | null): Promise<boolean> {
  if (response && [401, 403, 429, 503].includes(response.status())) return true;
  if (/\/(blocked|captcha|challenge)\b/i.test(new URL(page.url()).pathname)) return true;
  const title = await page.title().catch(() => "");
  const body = await page.locator("body").innerText({ timeout: 3000 }).catch(() => "");
  return BLOCK_PATTERN.test(title) || BLOCK_PATTERN.test(body.slice(0, 2000));
}

async function scrapeStore(store: StoreConfig, ask: (q: string) => Promise<string>) {
  const canonicals = loadCanonicalProducts();
  const terms = args.check ? canonicals.slice(0, 1) : canonicals;
  const records: RawRecord[] = [];
  const outFile = `${OUT}raw/${store.slug}${args.check ? ".check" : ""}.json`;

  const browser = await chromium.launch({
    headless: args.headless && !args.manual,
    executablePath: process.env.CHROMIUM_PATH || undefined,
  });
  const context = await browser.newContext({
    locale: "es-MX",
    viewport: { width: 1280, height: 900 },
    // Evidencia de la corrida para la demo (seccion 8). --check no graba.
    recordVideo: args.check ? undefined : { dir: `${OUT}videos/${store.slug}`, size: { width: 1280, height: 900 } },
  });
  const page = await context.newPage();

  // Via preferida: el JSON que la propia pagina pide (seccion 8, punto 2)
  let xhrBucket: RawProduct[] = [];
  page.on("response", async (response) => {
    if (!(response.headers()["content-type"] ?? "").includes("json") || !response.ok()) return;
    try {
      xhrBucket.push(...extractProducts(await response.json(), "xhr"));
    } catch {
      /* respuesta que no era JSON valido */
    }
  });

  console.log(`\n=== ${store.name}: ${terms.length} busqueda(s) ===`);
  if (args.manual) {
    // La persona navega como cualquier cliente; el script solo lee lo que la pagina ya cargo.
    await page.goto(new URL(store.searchUrl("x")).origin, { waitUntil: "domcontentloaded", timeout: 45_000 });
  }
  try {
    for (const canonical of terms) {
      xhrBucket = [];
      let response: Response | null = null;

      if (args.manual) {
        await ask(`\n[${store.name}] Busca "${canonical.search}" en la ventana del navegador y presiona Enter cuando se vean los resultados...`);
      } else {
        response = await page.goto(store.searchUrl(canonical.search), { waitUntil: "domcontentloaded", timeout: 45_000 });
        await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
      }

      if (await isBlocked(page, response)) {
        console.error(`  BLOQUEADO en "${canonical.search}" (${page.url()}). Se detiene ${store.name}; nada de esta tienda se guarda como valido.`);
        console.error(`  Opcion: correr de nuevo con --store ${store.slug} --manual y buscar a mano.`);
        break;
      }

      const products = await productsOnPage(page, xhrBucket);
      records.push({
        store: store.slug,
        canonical: canonical.name,
        term: canonical.search,
        page_url: page.url(),
        captured_at: new Date().toISOString(),
        products,
      });
      // Se escribe despues de cada busqueda: si algo truena, no se pierde lo capturado
      writeFileSync(outFile, JSON.stringify(records, null, 2));
      console.log(`  ${canonical.search}: ${products.length} producto(s) encontrados`);
      if (products.length === 0) console.warn("    0 productos: revisar la URL de busqueda o usar --manual");

      if (!args.manual) await page.waitForTimeout(Number(args.delay));
    }
  } finally {
    await context.close(); // cierra y guarda el video
    await browser.close();
  }
  console.log(`  Crudo: ${outFile}`);
}

async function main() {
  mkdirSync(`${OUT}raw`, { recursive: true });
  const stores = args.store ? STORES.filter((s) => s.slug === args.store) : STORES;
  if (stores.length === 0) throw new Error(`Tienda desconocida: ${args.store}. Opciones: ${STORES.map((s) => s.slug).join(", ")}`);

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    for (const store of stores) await scrapeStore(store, (q) => rl.question(q));
  } finally {
    rl.close();
  }
  console.log(`\nVideos en ${OUT}videos/. Siguiente paso: pnpm review`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
