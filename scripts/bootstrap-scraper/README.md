# bootstrap-scraper

Script **desechable** de la Fase 5: se corre **una sola vez**, con una persona supervisando y grabando pantalla, para armar el catálogo inicial de precios de Alsuper, Walmart y Soriana. No es parte de la app y **nunca escribe en la base de datos**: genera un archivo que se revisa a mano y luego se convierte en SQL para `supabase/seed.sql`.

```
Playwright → extractor (JSON de la página) → out/raw/*.json
          → pnpm review → out/review.csv  ← revisión humana
          → pnpm seed   → out/seed-products.sql → supabase/seed.sql
```

## Antes de empezar

```bash
pnpm install                                    # desde la raíz del repo
cd scripts/bootstrap-scraper
pnpm exec playwright install chromium ffmpeg    # navegador y grabación de video
```

Si ya tienes Chromium instalado en el sistema, puedes usarlo con `CHROMIUM_PATH=/usr/bin/chromium` (en ese caso solo instala `ffmpeg`).

**Reglas:**
- Corre una tienda a la vez, sin abrir varias ventanas en paralelo. El script espera 5 s entre búsquedas.
- Si una tienda muestra un bloqueo o un CAPTCHA, el script se detiene en esa tienda y lo reporta. **No se intenta saltar bloqueos.** Usa el modo manual.
- Revisa los términos de uso de cada tienda. Es una captura única, de bajo volumen, solo de precios públicos.

## 1. Capturar

Verificación del 2026-09-26: Walmart y Soriana bloquean navegadores automatizados, y la URL de búsqueda de Alsuper no está confirmada. Por eso **el modo recomendado es el manual**:

```bash
pnpm scrape --store alsuper --manual
pnpm scrape --store walmart --manual
pnpm scrape --store soriana --manual
```

En modo manual se abre la tienda en una ventana normal. Para cada producto, la terminal dice qué buscar: tú lo buscas en la página como cualquier cliente y presionas **Enter** cuando se vean los resultados. El script solo lee lo que la página ya cargó.

Otros modos:

| Comando | Qué hace |
|---|---|
| `pnpm scrape --check` | Una búsqueda automática por tienda, sin video, para probar si la URL de búsqueda funciona |
| `pnpm scrape --store alsuper` | Búsqueda automática de todos los productos en una tienda (solo si `--check` funcionó) |

Salida: `out/raw/<tienda>.json` (se guarda después de cada búsqueda) y el video en `out/videos/<tienda>/`, que sirve de evidencia para la demo.

## 2. Revisar

```bash
pnpm review
```

Genera `out/review.csv`. Ábrelo en Google Sheets o LibreOffice. Cada fila es un producto encontrado:

| Columna | Qué significa |
|---|---|
| `incluir` | **La única decisión que tomas:** `si` o `no`. Viene en `si` solo para los que están en estado `ok` |
| `estado` | `ok` = todo se leyó bien · `revisar` = coincide, pero falta el tamaño o el precio se ve raro · `descartado` = no corresponde al producto buscado |
| `motivo` | Por qué quedó en `revisar` o `descartado` |
| `cantidad_paquete`, `unidad` | Tamaño en unidad base: gramos (`mass_g`), mililitros (`volume_ml`) o piezas (`unit`) |
| `precio_centavos` | **Entero en centavos**: $139.00 = `13900` |

Qué revisar:
1. Las filas `ok`: que el nombre, el tamaño y el precio tengan sentido.
2. Las filas `revisar`: corrige el tamaño o el precio a mano y pon `si` si ya está bien.
3. Duplicados: deja una sola fila por producto y tienda.
4. La terminal lista los productos que quedaron **sin opción en alguna tienda**. Búscalos a mano o acepta que esa tienda no los tenga.

Descarga el archivo revisado como CSV y guárdalo de nuevo en `out/review.csv`.

## 3. Generar el SQL

```bash
pnpm seed                     # o: pnpm seed --file ruta/al/review.csv
```

Si alguna fila con `si` tiene datos inválidos (precio no entero, unidad incorrecta, tienda desconocida), el script **no genera nada** y lista los errores. Si todo está bien, crea `out/seed-products.sql`: pásalo a quien lleva Supabase (Fase 2) para incluirlo en `supabase/seed.sql`. El SQL es idempotente, así que correrlo dos veces no duplica filas.

## Agregar productos

Los productos que se buscan están en `packages/catalog-data/data/canonical-products.json` (la misma lista que usan las recetas). Para llegar a los 100-300 del MVP, agrega objetos con:

- `name`: nombre del producto conceptual (debe coincidir con el que usan las recetas);
- `unit_type`: `mass_g`, `volume_ml` o `unit`;
- `category`;
- `allergens`: alérgenos que aporta el producto (el validador de recetas los exige);
- `search`: lo que se escribe en el buscador de la tienda;
- `require`: palabras que el nombre debe tener;
- `exclude`: palabras que lo descartan.

## Pruebas

```bash
pnpm test
```

Cubren el parser de tamaños y precios, el extractor, el matcher, el CSV y la generación del SQL.
