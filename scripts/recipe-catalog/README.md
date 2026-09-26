# recipe-catalog

Catálogo de recetas **curadas a mano** (se pueden redactar con ayuda de IA, pero nunca se scrapean). El objetivo del MVP es tener 30-50 recetas. Este paquete tiene:

- `data/recipes.json`: todas las recetas, en un solo archivo;
- `data/colloquial-units.json`: pizca, cucharadita, cucharada y taza, con su equivalencia en unidad base;
- `pnpm validate`: revisa que ninguna receta rompa una regla dura;
- `pnpm seed`: genera `out/seed-recipes.sql` para `supabase/seed.sql`.

Los productos que puede usar una receta vienen de **`scripts/bootstrap-scraper/data/canonical-products.json`**, la misma lista que usa el scraper de precios. Si una receta necesita un ingrediente nuevo, primero se agrega ahí, con sus alérgenos, y así también se le buscarán precios.

## Flujo

```bash
cd scripts/recipe-catalog
# 1. agregar o editar recetas en data/recipes.json
pnpm validate      # 2. corregir hasta que no haya ERRORES
pnpm seed          # 3. genera out/seed-recipes.sql
pnpm test          # opcional: los tests también validan el recipes.json real
```

`out/seed-recipes.sql` se le pasa a quien lleva Supabase (Fase 2). Es idempotente: correrlo dos veces no duplica recetas, pasos ni ingredientes.

## Formato de una receta

```json
{
  "name": "Tacos de pollo",
  "cuisine": "Mexicana",
  "meal_type": ["comida", "cena"],
  "tags": ["rápida", "alta en proteína"],
  "prep_time_minutes": 25,
  "servings_base": 4,
  "allergens": [],
  "ingredients": [
    { "product": "Pechuga de pollo", "quantity": 500 },
    { "product": "Aceite vegetal", "amount": 1, "unit": "cucharada" }
  ],
  "steps": [
    { "title": "Cocer el pollo", "content": "Pon la pechuga en una olla con agua y sal.", "timer_seconds": 900 }
  ]
}
```

| Campo | Regla |
|---|---|
| `name` | Único en todo el catálogo |
| `meal_type` | Uno o más de: `desayuno`, `comida`, `cena`, `snack` |
| `tags` | Sugeridos: `rápida`, `económica`, `alta en proteína`, `vegetariana`, `ligera`, `para niños` |
| `servings_base` | Para cuántas personas es la receta. El planner escala las cantidades según las personas del plan |
| `allergens` | **Obligatorio y exacto.** Lista fija: `gluten`, `lácteos`, `huevo`, `cacahuate`, `nueces`, `soya`, `pescado`, `mariscos`, `ajonjolí`. Vacía si no tiene |
| `ingredients[].product` | Nombre **exacto** de `canonical-products.json` |
| `ingredients[].quantity` | Número en la unidad base del producto: gramos, mililitros o piezas |
| `ingredients[].amount` + `unit` | Alternativa a `quantity` con unidad coloquial: `2` + `cucharada` = 30 ml. No se puede usar una unidad de volumen para un producto que se mide en gramos |
| `steps[].title` | Corto (máximo 60 caracteres), porque lo muestra el modo cocina |
| `steps[].timer_seconds` | Segundos si el paso tiene tiempo; `null` si no |

## Qué revisa el validador

**Errores (bloquean el seed):**
- **Alergias:** si un ingrediente aporta un alérgeno que la receta no declara (por ejemplo, usa queso y no declara `lácteos`). Es la regla más importante, porque las alergias son una restricción dura.
- **Datos que no existen:** productos que no están en el catálogo canónico, unidades coloquiales desconocidas o de otra familia (masa contra volumen), tipos de comida o alérgenos fuera de la lista.
- **Repeticiones:** nombres repetidos o el mismo ingrediente dos veces en una receta.
- **Datos incompletos o fuera de rango:** cantidades en cero, porciones o tiempos inválidos, recetas sin pasos.

**Advertencias (revisar, no bloquean):**
- **Alérgenos de más:** una receta declara un alérgeno que ningún ingrediente aporta.
- **Tags fuera de la lista sugerida.**
- **Tiempos sin temporizador:** un paso dice "10 minutos" pero `timer_seconds` es `null`.
- **Poca variedad:** menos de 5 recetas de algún tipo de comida.

## Redactar recetas con IA

Se puede usar un LLM (a mano o en un flujo de n8n) para el borrador, pero **siempre la revisa una persona** y luego pasa por `pnpm validate`. Plantilla de prompt:

```text
Redacta [N] recetas caseras mexicanas, económicas y fáciles, para [comida/cena/desayuno].
Responde SOLO con un arreglo JSON; cada receta con este formato exacto:
{ "name", "cuisine", "meal_type", "tags", "prep_time_minutes", "servings_base",
  "allergens", "ingredients": [{ "product", "quantity" }], "steps": [{ "title", "content", "timer_seconds" }] }

Reglas:
- Usa SOLO estos productos, escritos exactamente así: [pegar los "name" de canonical-products.json]
- quantity en gramos, mililitros o piezas según el producto; para sal o aceite puedes usar
  "amount" + "unit" con: pizca, cucharadita, cucharada, taza.
- allergens solo de esta lista: gluten, lácteos, huevo, cacahuate, nueces, soya, pescado, mariscos, ajonjolí.
- meal_type de: desayuno, comida, cena, snack. servings_base = 4.
- 3 a 6 pasos por receta, títulos de máximo 60 caracteres, timer_seconds en segundos o null.
```

Después: pegar el resultado dentro de `"recipes"` en `data/recipes.json`, correr `pnpm validate` y corregir. Revisa a mano los alérgenos, las cantidades y que los pasos tengan sentido: el validador detecta errores de forma, no si una receta sabe bien.
