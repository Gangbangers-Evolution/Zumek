import type { PantryInventory } from "@zumek/domain";
import { buildSampleCatalog } from "@zumek/catalog-data";
import { describe, expect, it } from "vitest";
import { applyPantryUpdate, closePlanIntoPantry, declarePantry, planPantryDelta } from "./index";
import { catalog, plan, prefs } from "./test-helpers";

const sampleCatalog = buildSampleCatalog();

const cat = catalog(
  [
    { id: "pollo", unit: "mass_g", packageQuantity: 1000, priceCents: 10_000 },
    { id: "arroz", unit: "mass_g", packageQuantity: 1000, priceCents: 3000 },
  ],
  [
    { id: "pollo-asado", ingredients: [["pollo", 500]] },
    { id: "arroz-blanco", ingredients: [["arroz", 300]] },
  ],
);

function row(canonical: string, quantity: number, id = `row-${canonical}`): PantryInventory {
  return {
    id,
    user_id: "u1",
    canonical_product_id: canonical,
    remaining_quantity: quantity,
    unit: "mass_g",
    source_plan_id: "plan-anterior",
    updated_at: "2026-09-01T00:00:00Z",
  };
}

function close(bundle: ReturnType<typeof plan>, existing: PantryInventory[] = []) {
  return closePlanIntoPantry({
    bundle,
    catalog: cat,
    existing,
    updatedAt: "2026-09-27T00:00:00Z",
    newId: (canonical) => `new-${canonical}`,
  });
}

describe("despensa al cerrar un plan (invariante 3)", () => {
  it("lo que sobra del paquete completo entra a la despensa", () => {
    // 1 comida de pollo: compra 1 kg, usa 500 g
    const bundle = plan(cat, prefs({ excludedProductIds: ["arroz"] }));
    const update = close(bundle);

    expect(update.deletes).toEqual([]);
    expect(update.upserts).toEqual([
      expect.objectContaining({
        id: "new-pollo",
        user_id: "u1",
        canonical_product_id: "pollo",
        remaining_quantity: 500,
        unit: "mass_g",
        source_plan_id: bundle.plan.id,
      }),
    ]);
  });

  it("suma sobre la fila existente, nunca la reemplaza", () => {
    const bundle = plan(cat, prefs({ excludedProductIds: ["arroz"] }));
    const update = close(bundle, [row("pollo", 200)]);

    expect(update.upserts).toHaveLength(1);
    expect(update.upserts[0]).toMatchObject({ id: "row-pollo", remaining_quantity: 700 });
  });

  it("descuenta lo que el plan tomo de la despensa sin comprar", () => {
    // Hay 500 g de arroz en casa; la receta usa 300 g y no se compra nada
    const bundle = plan(cat, prefs({ excludedProductIds: ["pollo"], pantry: { arroz: 500 } }));
    expect(bundle.shopping_items).toHaveLength(0);

    const update = close(bundle, [row("arroz", 500)]);
    expect(update.upserts[0]).toMatchObject({ id: "row-arroz", remaining_quantity: 200 });
  });

  it("si se acaba un ingrediente, su fila se elimina", () => {
    const bundle = plan(cat, prefs({ excludedProductIds: ["pollo"], pantry: { arroz: 300 } }));
    const update = close(bundle, [row("arroz", 300)]);

    expect(update.upserts).toEqual([]);
    expect(update.deletes).toEqual(["row-arroz"]);
  });

  it("escala lo usado por personas del plan", () => {
    // 4 personas, servings_base 2: usa 1000 g de pollo, compra exactamente 1 kg, no sobra nada
    const bundle = plan(cat, prefs({ peopleCount: 4, excludedProductIds: ["arroz"] }));
    expect(planPantryDelta(bundle, cat).get("pollo")).toBe(0);
    expect(close(bundle).upserts).toEqual([]);
  });

  it("un plan no viable (sin comidas ni compras) no cambia la despensa", () => {
    const bundle = plan(cat, prefs({ budgetCents: 100, excludedProductIds: ["arroz"] }));
    expect(bundle.plan.status).toBe("infeasible_likely");
    expect(close(bundle, [row("pollo", 200)])).toEqual({ upserts: [], deletes: [] });
  });

  it("no toca filas de otros usuarios", () => {
    const bundle = plan(cat, prefs({ excludedProductIds: ["arroz"] }));
    const ajena = { ...row("pollo", 999, "ajena"), user_id: "otro" };
    const update = close(bundle, [ajena]);
    expect(update.upserts[0]).toMatchObject({ id: "new-pollo", remaining_quantity: 500 });
  });

  it("con los fixtures reales: despensa final = inicial + comprado - usado, nunca negativa", () => {
    const stores = ["store-walmart", "store-soriana", "store-alsuper"];
    const initial: PantryInventory[] = [
      { ...row("cp-arroz", 400), unit: "mass_g" },
      { ...row("cp-aceite-vegetal", 800), unit: "volume_ml" },
    ];
    const bundle = plan(
      sampleCatalog,
      prefs({
        daysCount: 7,
        mealTypes: ["comida", "cena"],
        storeIds: stores,
        pantry: { "cp-arroz": 400, "cp-aceite-vegetal": 800 },
      }),
    );
    const update = closePlanIntoPantry({
      bundle,
      catalog: sampleCatalog,
      existing: initial,
      updatedAt: "2026-09-27T00:00:00Z",
      newId: (c) => `new-${c}`,
    });
    const final = applyPantryUpdate(initial, update);
    const delta = planPantryDelta(bundle, sampleCatalog);

    for (const item of final) expect(item.remaining_quantity).toBeGreaterThan(0);
    for (const [canonical, change] of delta) {
      const before = initial.find((r) => r.canonical_product_id === canonical)?.remaining_quantity ?? 0;
      const after = final.find((r) => r.canonical_product_id === canonical)?.remaining_quantity ?? 0;
      expect(after).toBeCloseTo(Math.max(0, before + change), 3);
    }
  });
});

describe("despensa declarada en el onboarding", () => {
  function declare(declared: Record<string, number>, existing: PantryInventory[] = []) {
    return declarePantry({
      declared,
      existing,
      userId: "u1",
      catalog: cat,
      updatedAt: "2026-09-27T00:00:00Z",
      newId: (canonical) => `new-${canonical}`,
    });
  }

  it("reemplaza (no suma): lo declarado es la fuente de verdad", () => {
    const result = declare({ arroz: 100 }, [row("arroz", 500), row("pollo", 300)]);
    expect(result).toEqual([
      expect.objectContaining({ id: "row-arroz", canonical_product_id: "arroz", remaining_quantity: 100 }),
    ]);
  });

  it("filas nuevas sin plan de origen; las que no cambian conservan origen y fecha", () => {
    const [nueva, igual] = declare({ pollo: 250, arroz: 500 }, [row("arroz", 500)]).sort((a, b) => a.id.localeCompare(b.id));
    expect(nueva).toMatchObject({ id: "new-pollo", source_plan_id: null, updated_at: "2026-09-27T00:00:00Z" });
    expect(igual).toMatchObject({ id: "row-arroz", source_plan_id: "plan-anterior", updated_at: "2026-09-01T00:00:00Z" });
  });

  it("no toca la despensa de otros usuarios", () => {
    const ajena = { ...row("pollo", 999, "ajena"), user_id: "otro" };
    expect(declare({}, [ajena])).toEqual([ajena]);
  });

  it("truena con un producto que no existe en el catalogo", () => {
    expect(() => declare({ "no-existe": 1 })).toThrow(/desconocido/);
  });
});
