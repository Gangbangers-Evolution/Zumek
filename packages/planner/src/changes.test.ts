import { buildSampleCatalog } from "@zumek/catalog-data";
import { indexCatalog } from "@zumek/domain";
import { describe, expect, it } from "vitest";
import { closePlanIntoPantry, generatePlan, swapIngredient, swapMeal } from "./index";
import { catalog, input, plan, prefs } from "./test-helpers";

describe("swapMeal (swap_recipe)", () => {
  const cat = catalog(
    [
      { id: "arroz", unit: "mass_g", packageQuantity: 1000, priceCents: 3000 },
      { id: "frijol", unit: "mass_g", packageQuantity: 1000, priceCents: 4000 },
      { id: "res", unit: "mass_g", packageQuantity: 1000, priceCents: 15_000 },
    ],
    [
      { id: "r-arroz", ingredients: [["arroz", 200]] },
      { id: "r-frijol", ingredients: [["frijol", 200]] },
      { id: "r-res", ingredients: [["res", 300]] },
    ],
  );
  const p = prefs({ daysCount: 2, budgetCents: 50_000 });

  it("cambia solo esa comida, nunca por la receta excluida, y deja el resto igual", () => {
    const current = plan(cat, p);
    const target = current.meals[0]!;
    const next = swapMeal(input(cat, p), current, {
      dayIndex: target.day_index,
      mealType: target.meal_type,
      excludeRecipeId: target.recipe_id,
    });

    expect(next).not.toBeNull();
    const swapped = next!.meals.find((m) => m.day_index === target.day_index)!;
    expect(swapped.recipe_id).not.toBe(target.recipe_id);
    expect(next!.meals.filter((m) => m.day_index !== target.day_index)).toEqual(
      current.meals.filter((m) => m.day_index !== target.day_index).map((m) => ({ ...m, id: m.id.replace("p1", "p2"), plan_id: "p2" })),
    );
    // Costo recalculado con paquetes completos
    const sum = next!.shopping_items.reduce((s, i) => s + i.price_cents_snapshot * i.quantity_packages, 0);
    expect(next!.plan.total_cost_cents).toBe(sum);
    expect(next!.plan.id).toBe("p2");
  });

  it("null si la comida no existe en el plan", () => {
    const current = plan(cat, p);
    expect(swapMeal(input(cat, p), current, { dayIndex: 5, mealType: "comida", excludeRecipeId: "r-arroz" })).toBeNull();
  });

  it("null si no hay otra receta posible para ese slot", () => {
    const solo = catalog([{ id: "arroz", unit: "mass_g", packageQuantity: 1000, priceCents: 3000 }], [
      { id: "r-arroz", ingredients: [["arroz", 200]] },
    ]);
    const current = plan(solo, prefs());
    expect(swapMeal(input(solo, prefs()), current, { dayIndex: 0, mealType: "comida", excludeRecipeId: "r-arroz" })).toBeNull();
  });
});

describe("swapIngredient (swap_ingredient)", () => {
  const cat = catalog(
    [
      { id: "queso", unit: "mass_g", packageQuantity: 400, priceCents: 8000, category: "lacteo", allergens: ["lácteos"] },
      { id: "queso-caro", unit: "mass_g", packageQuantity: 400, priceCents: 12_000, category: "lacteo", allergens: ["lácteos"] },
      { id: "panela", unit: "mass_g", packageQuantity: 400, priceCents: 5000, category: "lacteo", allergens: ["lácteos"] },
      { id: "tofu", unit: "mass_g", packageQuantity: 400, priceCents: 4000, category: "proteina" },
      { id: "tortilla", unit: "mass_g", packageQuantity: 1000, priceCents: 2500, category: "grano" },
    ],
    [{ id: "r-quesadilla", allergens: ["lácteos"], ingredients: [["tortilla", 200], ["queso-caro", 150]] }],
  );
  const p = prefs();

  it("elige el sustituto mas barato de la misma categoria y unidad, y recalcula la compra", () => {
    const current = plan(cat, p);
    const result = swapIngredient(input(cat, p), current, { recipeId: "r-quesadilla", canonicalProductId: "queso-caro" });

    expect(result?.substituteId).toBe("panela"); // tofu es mas barato pero de otra categoria
    expect(result!.substitutions).toEqual({ "r-quesadilla": { "queso-caro": "panela" } });
    expect(result!.bundle.shopping_items.map((i) => i.commercial_product_id).sort()).toEqual(["com-panela", "com-tortilla"]);
    expect(result!.bundle.plan.total_cost_cents).toBe(7500);
    expect(result!.bundle.plan.total_cost_cents).toBeLessThan(current.plan.total_cost_cents);
  });

  it("nunca propone un sustituto con alergeno del usuario, aunque sea el mas barato", () => {
    const cat2 = catalog(
      [
        { id: "atun", unit: "mass_g", packageQuantity: 1000, priceCents: 3000, category: "proteina", allergens: ["pescado"] },
        { id: "pollo", unit: "mass_g", packageQuantity: 1000, priceCents: 9000, category: "proteina" },
        { id: "res", unit: "mass_g", packageQuantity: 1000, priceCents: 12_000, category: "proteina" },
      ],
      [{ id: "r-res", ingredients: [["res", 300]] }],
    );
    const p2 = prefs({ allergens: ["pescado"] });
    const result = swapIngredient(input(cat2, p2), plan(cat2, p2), { recipeId: "r-res", canonicalProductId: "res" });
    expect(result?.substituteId).toBe("pollo");
    // Si todos los sustitutos traen el alergeno, no hay propuesta
    const p3 = prefs({ allergens: ["lácteos"] });
    expect(swapIngredient(input(cat, p3), plan(cat, p), { recipeId: "r-quesadilla", canonicalProductId: "queso-caro" })).toBeNull();
  });

  it("un sustituto con alergeno nuevo no se cuela en planes posteriores", () => {
    const cat3 = catalog(
      [
        { id: "pollo", unit: "mass_g", packageQuantity: 1000, priceCents: 9000, category: "proteina" },
        { id: "atun", unit: "mass_g", packageQuantity: 1000, priceCents: 5000, category: "proteina", allergens: ["pescado"] },
      ],
      [{ id: "r-pollo", ingredients: [["pollo", 300]] }],
    );
    const withSwap = { "r-pollo": { pollo: "atun" } };
    const replanned = generatePlan({ ...input(cat3, prefs({ allergens: ["pescado"] })), substitutions: withSwap });
    expect(replanned.plan.status).toBe("infeasible_likely");
    expect(replanned.meals).toEqual([]);
  });

  it("al cerrar la semana, la despensa descuenta el sustituto y no el original", () => {
    const current = plan(cat, p);
    const result = swapIngredient(input(cat, p), current, { recipeId: "r-quesadilla", canonicalProductId: "queso-caro" })!;
    const update = closePlanIntoPantry({
      bundle: result.bundle,
      catalog: cat,
      substitutions: result.substitutions,
      existing: [],
      updatedAt: "2026-09-27T00:00:00Z",
      newId: (id) => `pantry-${id}`,
    });
    const left = Object.fromEntries(update.upserts.map((r) => [r.canonical_product_id, r.remaining_quantity]));
    expect(left).toEqual({ panela: 400 - 150, tortilla: 1000 - 200 });
  });

  it("volver al ingrediente original quita la sustitucion", () => {
    const withSwap = { "r-quesadilla": { "queso-caro": "panela" } };
    const cat4 = catalog(
      [
        { id: "queso-caro", unit: "mass_g", packageQuantity: 400, priceCents: 1000, category: "lacteo" },
        { id: "panela", unit: "mass_g", packageQuantity: 400, priceCents: 5000, category: "lacteo" },
        { id: "tortilla", unit: "mass_g", packageQuantity: 1000, priceCents: 2500, category: "grano" },
      ],
      [{ id: "r-quesadilla", ingredients: [["tortilla", 200], ["queso-caro", 150]] }],
    );
    const current = generatePlan({ ...input(cat4, p, "p1"), substitutions: withSwap });
    const result = swapIngredient({ ...input(cat4, p), substitutions: withSwap }, current, {
      recipeId: "r-quesadilla",
      canonicalProductId: "panela",
    });
    expect(result?.substituteId).toBe("queso-caro");
    expect(result!.substitutions).toEqual({ "r-quesadilla": {} });
    // Con el id original (como lo conoce la base) se cambia el sustituto actual
    const byOriginal = swapIngredient({ ...input(cat4, p), substitutions: withSwap }, current, {
      recipeId: "r-quesadilla",
      canonicalProductId: "queso-caro",
    });
    expect(byOriginal?.substituteId).toBe("queso-caro");
  });
});

describe("swapIngredient con el catalogo real", () => {
  const real = indexCatalog(buildSampleCatalog());
  const stores = real.stores.map((s) => s.id);
  const recipeUsing = (productId: string) =>
    real.recipes.find((r) => real.ingredientsByRecipe.get(r.id)?.some((i) => i.canonical_product_id === productId))!;

  it.each([
    ["cp-queso-fresco", "cp-queso-oaxaca"],
    ["cp-aceite-vegetal", "cp-aceite-de-oliva"],
    ["cp-tortilla-de-maiz", "cp-tortilla-de-harina"],
  ])("%s solo se cambia por su mismo grupo culinario (%s)", (from, to) => {
    const recipe = recipeUsing(from);
    const p = prefs({ storeIds: stores, mealTypes: recipe.meal_type, budgetCents: 1_000_000 });
    // Un plan de un dia con solo esa receta como candidata posible
    const only = { ...real, recipes: [recipe] };
    const current = generatePlan(input(only, p, "p1"));
    const result = swapIngredient(input(only, p), current, { recipeId: recipe.id, canonicalProductId: from });
    expect(result?.substituteId).toBe(to);
  });
});
