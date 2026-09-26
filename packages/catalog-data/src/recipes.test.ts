import { describe, expect, it } from "vitest";
import { validateRecipes } from "./recipes";
import { buildSampleCatalog } from "./sample-catalog";
import { buildRecipesSql } from "./seed-sql";
import { RECIPES_FILE, type CanonicalProductSpec, type ColloquialUnitSpec } from "./specs";

const scraping = { search: "", require: [], exclude: [] };
const products: CanonicalProductSpec[] = [
  { name: "Queso fresco", unit_type: "mass_g", category: "lacteo", allergens: ["lácteos"], ...scraping },
  { name: "Jitomate", unit_type: "mass_g", category: "verdura", allergens: [], ...scraping },
  { name: "Aceite vegetal", unit_type: "volume_ml", category: "despensa", allergens: [], ...scraping },
  { name: "Sal", unit_type: "mass_g", category: "despensa", allergens: [], ...scraping },
];
const units: ColloquialUnitSpec[] = [
  { term: "pizca", base_quantity: 1, base_unit: "mass_g" },
  { term: "cucharada", base_quantity: 15, base_unit: "volume_ml" },
];

function recipe(overrides: Record<string, unknown> = {}) {
  return {
    name: "Ensalada",
    cuisine: "Mexicana",
    meal_type: ["comida"],
    tags: ["rápida"],
    prep_time_minutes: 10,
    servings_base: 2,
    allergens: ["lácteos"],
    ingredients: [
      { product: "Jitomate", quantity: 300 },
      { product: "Queso fresco", quantity: 100 },
      { product: "Aceite vegetal", amount: 2, unit: "cucharada" },
      { product: "Sal", amount: 1, unit: "pizca" },
    ],
    steps: [
      { title: "Picar", content: "Pica el jitomate y el queso.", timer_seconds: null },
      { title: "Servir", content: "Aliña con aceite y sal.", timer_seconds: null },
    ],
    ...overrides,
  };
}

function validate(...recipes: unknown[]) {
  return validateRecipes({ recipes }, products, units);
}

function messages(result: ReturnType<typeof validate>) {
  return result.errors.map((e) => e.message).join(" | ");
}

describe("validateRecipes", () => {
  it("el catalogo real del repo es valido", () => {
    const result = validateRecipes(RECIPES_FILE);
    expect(result.errors).toEqual([]);
    expect(result.recipes.length).toBeGreaterThanOrEqual(6);
  });

  it("acepta una receta correcta y convierte unidades coloquiales a unidad base", () => {
    const result = validate(recipe());
    expect(result.errors).toEqual([]);
    expect(result.recipes[0]!.ingredients).toContainEqual({ product: "Aceite vegetal", quantity: 30, unit: "volume_ml" });
    expect(result.recipes[0]!.ingredients).toContainEqual({ product: "Sal", quantity: 1, unit: "mass_g" });
  });

  it("ALERGIA: rechaza una receta que usa un ingrediente con alergeno sin declararlo", () => {
    expect(messages(validate(recipe({ allergens: [] })))).toMatch(/Queso fresco \(lácteos\) pero no declara "lácteos"/);
  });

  it("rechaza alergenos fuera de la lista fija", () => {
    expect(messages(validate(recipe({ allergens: ["lácteos", "lactosa"] })))).toMatch(/lactosa/);
  });

  it("rechaza productos que no existen en el catalogo canonico", () => {
    expect(messages(validate(recipe({ ingredients: [{ product: "Pechuga de pavo", quantity: 200 }] })))).toMatch(/no existe/);
  });

  it("rechaza unidades coloquiales de otra familia (sin conversion entre masa y volumen)", () => {
    const bad = recipe({ ingredients: [{ product: "Jitomate", amount: 1, unit: "cucharada" }], allergens: [] });
    expect(messages(validate(bad))).toMatch(/volume_ml pero Jitomate se mide en mass_g/);
  });

  it("rechaza datos incompletos o fuera de rango", () => {
    const text = messages(
      validate(
        recipe({ meal_type: ["almuerzo"] }),
        recipe({ name: "B", servings_base: 0 }),
        recipe({ name: "C", steps: [{ title: "Hornear", content: "Hornea.", timer_seconds: -5 }] }),
        recipe({ name: "D", ingredients: [{ product: "Sal", quantity: 1, amount: 1, unit: "pizca" }], allergens: [] }),
      ),
    );
    expect(text).toMatch(/meal_type invalido "almuerzo"/);
    expect(text).toMatch(/servings_base/);
    expect(text).toMatch(/timer_seconds/);
    expect(text).toMatch(/quantity O amount\+unit/);
  });

  it("rechaza nombres repetidos e ingredientes repetidos", () => {
    const dupIngredient = recipe({
      name: "Otra",
      ingredients: [
        { product: "Jitomate", quantity: 100 },
        { product: "Jitomate", quantity: 50 },
      ],
      allergens: [],
    });
    const text = messages(validate(recipe(), recipe(), dupIngredient));
    expect(text).toMatch(/nombre repetido/);
    expect(text).toMatch(/Jitomate" repetido/);
  });

  it("advierte (sin bloquear) tiempos sin temporizador y poca variedad", () => {
    const result = validate(recipe({ steps: [{ title: "Hervir", content: "Hierve 10 minutos.", timer_seconds: null }, { title: "Servir", content: "Sirve." }] }));
    expect(result.errors).toEqual([]);
    const text = result.warnings.map((w) => w.message).join(" | ");
    expect(text).toMatch(/menciona un tiempo/);
    expect(text).toMatch(/solo 1 receta\(s\) de comida/);
  });
});

describe("buildRecipesSql", () => {
  it("genera SQL idempotente, con arreglos de Postgres y comillas escapadas", () => {
    // Productos reales del catalogo: el SQL tambien siembra los canonicos que usan las recetas
    const { recipes } = validateRecipes({
      recipes: [recipe({ name: "Ensalada de la 'abuela'", tags: ["rápida", "alta en proteína"] })],
    });
    const sql = buildRecipesSql(recipes);

    expect(sql).toContain("'Ensalada de la ''abuela'''");
    expect(sql).toContain(`'{"rápida","alta en proteína"}'`);
    expect(sql).toContain(`'{"comida"}'`);
    expect(sql.match(/insert into recipe_step/g)).toHaveLength(2);
    expect(sql.match(/insert into recipe_ingredient/g)).toHaveLength(4);
    // Cada insert trae su guarda para no duplicar al correrlo dos veces
    const inserts = sql.split("\n").filter((l) => l.startsWith("insert"));
    expect(inserts.every((l) => l.includes("where not exists"))).toBe(true);
  });
});

describe("buildSampleCatalog", () => {
  const catalog = buildSampleCatalog();

  it("la app usa exactamente las recetas validadas, con sus alergenos", () => {
    const avena = catalog.recipes.find((r) => r.name === "Avena con plátano");
    expect(avena?.allergens).toEqual(["gluten", "lácteos"]);
    expect(catalog.recipes).toHaveLength((validateRecipes(RECIPES_FILE).recipes).length);
  });

  it("todas las referencias apuntan a filas que existen", () => {
    const ids = (rows: { id: string }[]) => new Set(rows.map((r) => r.id));
    const recipes = ids(catalog.recipes);
    const products = ids(catalog.canonical_products);
    const stores = ids(catalog.stores);
    const commercial = ids(catalog.commercial_products);
    for (const i of catalog.recipe_ingredients) {
      expect(recipes.has(i.recipe_id)).toBe(true);
      expect(products.has(i.canonical_product_id)).toBe(true);
    }
    for (const s of catalog.recipe_steps) expect(recipes.has(s.recipe_id)).toBe(true);
    for (const c of catalog.commercial_products) {
      expect(products.has(c.canonical_product_id)).toBe(true);
      expect(stores.has(c.store_id)).toBe(true);
    }
    for (const p of catalog.latest_prices) {
      expect(commercial.has(p.commercial_product_id)).toBe(true);
      expect(Number.isInteger(p.price_cents)).toBe(true);
    }
  });

  it("los ids son unicos", () => {
    for (const rows of [catalog.recipes, catalog.canonical_products, catalog.commercial_products, catalog.recipe_ingredients, catalog.recipe_steps]) {
      expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
    }
  });
});
