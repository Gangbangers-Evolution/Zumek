import { catalogFixture } from "@zumek/domain/fixtures";
import { describe, expect, it } from "vitest";
import { scaleQuantity } from "./index";
import { catalog, plan, prefs } from "./test-helpers";

// ---------- casos obligatorios (seccion 9) ----------

describe("generatePlan", () => {
  it("caso feliz: presupuesto suficiente da status ok y total <= presupuesto", () => {
    const cat = catalog(
      [
        { id: "arroz", unit: "mass_g", packageQuantity: 1000, priceCents: 3000 },
        { id: "frijol", unit: "mass_g", packageQuantity: 1000, priceCents: 4000 },
      ],
      [
        { id: "r-arroz", ingredients: [["arroz", 200]] },
        { id: "r-frijol", ingredients: [["frijol", 200]] },
      ],
    );
    const result = plan(cat, prefs({ daysCount: 3, budgetCents: 20_000 }));

    expect(result.plan.status).toBe("ok");
    expect(result.plan.total_cost_cents).toBeLessThanOrEqual(result.plan.budget_cents);
    expect(result.meals).toHaveLength(3);
    // El total es exactamente la suma de paquetes completos a precio snapshot
    const sum = result.shopping_items.reduce((s, i) => s + i.price_cents_snapshot * i.quantity_packages, 0);
    expect(result.plan.total_cost_cents).toBe(sum);
  });

  it("reutilizacion: prefiere la receta que usa el paquete ya abierto", () => {
    const cat = catalog(
      [
        { id: "pollo", unit: "mass_g", packageQuantity: 1000, priceCents: 10_000 },
        { id: "res", unit: "mass_g", packageQuantity: 1000, priceCents: 11_000 },
      ],
      [
        { id: "a-pollo-asado", ingredients: [["pollo", 500]] },
        { id: "b-tacos-pollo", ingredients: [["pollo", 500]] },
        { id: "c-res", ingredients: [["res", 500]] },
      ],
    );
    const result = plan(cat, prefs({ daysCount: 2, budgetCents: 30_000 }));

    expect(result.meals.map((m) => m.recipe_id).sort()).toEqual(["a-pollo-asado", "b-tacos-pollo"]);
    // Un solo paquete de pollo cubre las dos recetas
    expect(result.shopping_items).toHaveLength(1);
    expect(result.shopping_items[0]).toMatchObject({ commercial_product_id: "com-pollo", quantity_packages: 1 });
    expect(result.plan.total_cost_cents).toBe(10_000);
  });

  it("alergia: una receta con alergeno declarado nunca aparece, aunque sea la mas barata", () => {
    const cat = catalog(
      [
        { id: "huevo", unit: "unit", packageQuantity: 12, priceCents: 3000 },
        { id: "pollo", unit: "mass_g", packageQuantity: 1000, priceCents: 12_000 },
      ],
      [
        { id: "huevos", allergens: ["Huevo"], ingredients: [["huevo", 4]] },
        { id: "pollo", ingredients: [["pollo", 300]] },
      ],
    );
    const result = plan(cat, prefs({ daysCount: 7, allergens: ["huevo"], budgetCents: 200_000 }));

    expect(result.meals).toHaveLength(7);
    expect(result.meals.every((m) => m.recipe_id !== "huevos")).toBe(true);
    expect(result.shopping_items.some((i) => i.commercial_product_id === "com-huevo")).toBe(false);
  });

  it("escalado por personas: cantidad * personas / servings_base", () => {
    expect(scaleQuantity(300, 2, 4)).toBe(600);
    expect(scaleQuantity(300, 4, 2)).toBe(150);

    const cat = catalog(
      [{ id: "arroz", unit: "mass_g", packageQuantity: 1000, priceCents: 3000 }],
      [{ id: "r", servingsBase: 2, ingredients: [["arroz", 300]] }],
    );
    // 4 personas: 600 g -> 1 paquete de 1 kg. 8 personas: 1200 g -> 2 paquetes.
    expect(plan(cat, prefs({ peopleCount: 4 })).shopping_items[0]!.quantity_packages).toBe(1);
    expect(plan(cat, prefs({ peopleCount: 8 })).shopping_items[0]!.quantity_packages).toBe(2);
  });

  describe("status sin garantia de imposibilidad", () => {
    // Unica receta posible: cuesta exactamente $100.00
    const cat = catalog(
      [{ id: "pollo", unit: "mass_g", packageQuantity: 1000, priceCents: 10_000 }],
      [{ id: "r", ingredients: [["pollo", 500]] }],
    );

    it("over_budget_close cuando se pasa menos de 10%", () => {
      const result = plan(cat, prefs({ budgetCents: 9_500 }));
      expect(result.plan.status).toBe("over_budget_close");
      expect(result.plan.total_cost_cents).toBe(10_000);
      expect(result.meals).toHaveLength(1);
    });

    it("infeasible_likely cuando se pasa por mucho", () => {
      const result = plan(cat, prefs({ budgetCents: 5_000 }));
      expect(result.plan.status).toBe("infeasible_likely");
      expect(result.meals).toHaveLength(0);
      expect(result.shopping_items).toHaveLength(0);
    });

    it("infeasible_likely cuando no se pueden cubrir las comidas pedidas", () => {
      // No hay ninguna receta de desayuno
      const result = plan(cat, prefs({ mealTypes: ["desayuno", "comida"] }));
      expect(result.plan.status).toBe("infeasible_likely");
    });
  });
});

// ---------- reglas adicionales del Master Prompt ----------

describe("restricciones duras y reglas de dominio", () => {
  it("ingredientes prohibidos y tiendas no seleccionadas nunca entran", () => {
    const cat = catalog(
      [
        { id: "cebolla", unit: "unit", packageQuantity: 1, priceCents: 500 },
        { id: "arroz", unit: "mass_g", packageQuantity: 1000, priceCents: 3000 },
        { id: "res", unit: "mass_g", packageQuantity: 1000, priceCents: 9000, store: "s2" },
      ],
      [
        { id: "con-cebolla", ingredients: [["cebolla", 1]] },
        { id: "solo-arroz", ingredients: [["arroz", 200]] },
        { id: "res-otra-tienda", ingredients: [["res", 300]] },
      ],
    );
    const result = plan(cat, prefs({ daysCount: 3, excludedProductIds: ["cebolla"] }));
    expect(new Set(result.meals.map((m) => m.recipe_id))).toEqual(new Set(["solo-arroz"]));
    expect(result.shopping_items.every((i) => i.store_id === "s1")).toBe(true);
  });

  it("usa primero la despensa antes de comprar", () => {
    const cat = catalog(
      [{ id: "arroz", unit: "mass_g", packageQuantity: 1000, priceCents: 3000 }],
      [{ id: "r", ingredients: [["arroz", 300]] }],
    );
    const result = plan(cat, prefs({ pantry: { arroz: 500 } }));
    expect(result.shopping_items).toHaveLength(0);
    expect(result.plan.total_cost_cents).toBe(0);
  });

  it("es determinista: mismos datos, mismo plan", () => {
    const p = prefs({ daysCount: 7, mealTypes: ["comida", "cena"], storeIds: ["store-walmart", "store-soriana", "store-alsuper"] });
    expect(plan(catalogFixture, p)).toEqual(plan(catalogFixture, p));
  });

  it("con los fixtures reales arma una semana completa y respeta alergias", () => {
    const result = plan(
      catalogFixture,
      prefs({
        budgetCents: 90_000,
        daysCount: 7,
        mealTypes: ["comida", "cena"],
        allergens: ["lacteos"],
        storeIds: ["store-walmart", "store-soriana", "store-alsuper"],
      }),
    );
    const lacteos = new Set(catalogFixture.recipes.filter((r) => r.allergens.includes("lacteos")).map((r) => r.id));
    expect(result.plan.status).toBe("ok");
    expect(result.meals).toHaveLength(14);
    expect(result.meals.some((m) => lacteos.has(m.recipe_id))).toBe(false);
    expect(result.shopping_items.every((i) => Number.isInteger(i.price_cents_snapshot))).toBe(true);
  });
});
