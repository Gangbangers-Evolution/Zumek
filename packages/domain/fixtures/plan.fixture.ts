import type {
  MealType,
  PantryInventory,
  PlanBundle,
  PlanMeal,
  PlanShoppingItem,
  UnitType,
} from "../src/index";
import { commercialProductsFixture, priceObservationsFixture } from "./products.fixture";

const USER_ID = "user-fixture";
const CREATED_AT = "2026-09-21T18:00:00Z";

const week: Array<[comida: string, cena: string]> = [
  ["rec-arroz-pollo", "rec-tacos-pollo"],
  ["rec-pasta-jitomate", "rec-huevos-mexicana"],
  ["rec-enfrijoladas", "rec-tacos-pollo"],
  ["rec-arroz-pollo", "rec-huevos-mexicana"],
  ["rec-pasta-jitomate", "rec-enfrijoladas"],
  ["rec-tacos-pollo", "rec-huevos-mexicana"],
  ["rec-enfrijoladas", "rec-pasta-jitomate"],
];

function mealsFor(planId: string): PlanMeal[] {
  return week.flatMap(([comida, cena], day) =>
    (
      [
        ["comida", comida],
        ["cena", cena],
      ] as Array<[MealType, string]>
    ).map(([mealType, recipeId]) => ({
      id: `${planId}-d${day}-${mealType}`,
      plan_id: planId,
      day_index: day,
      meal_type: mealType,
      recipe_id: recipeId,
    })),
  );
}

// [commercial_product_id, quantity_packages]
const shopping: Array<[string, number]> = [
  ["com-pollo-wal", 2],
  ["com-arroz-wal", 1],
  ["com-tortilla-wal", 2],
  ["com-frijol-wal", 1],
  ["com-jitomate-wal", 2],
  ["com-cebolla-wal", 4],
  ["com-pasta-sor", 3],
  ["com-queso-sor", 1],
  ["com-huevo-sor", 1],
  ["com-crema-sor", 1],
  ["com-aceite-als", 1],
  ["com-sal-als", 1],
  ["com-ajo-als", 1],
  ["com-serrano-als", 1],
  ["com-cilantro-als", 1],
];

function shoppingFor(planId: string): PlanShoppingItem[] {
  return shopping.map(([commercialId, packages]) => {
    const commercial = commercialProductsFixture.find((c) => c.id === commercialId);
    const price = priceObservationsFixture.find((p) => p.commercial_product_id === commercialId);
    if (!commercial || !price) throw new Error(`fixture inconsistente: ${commercialId}`);
    return {
      id: `${planId}-${commercialId}`,
      plan_id: planId,
      commercial_product_id: commercialId,
      quantity_packages: packages,
      price_cents_snapshot: price.price_cents,
      store_id: commercial.store_id,
    };
  });
}

function totalOf(items: PlanShoppingItem[]): number {
  return items.reduce((sum, i) => sum + i.price_cents_snapshot * i.quantity_packages, 0);
}

const okItems = shoppingFor("plan-ok");
const okTotal = totalOf(okItems);

/** Caso feliz: el plan cabe en el presupuesto. */
export const planOkFixture: PlanBundle = {
  plan: {
    id: "plan-ok",
    user_id: USER_ID,
    budget_cents: 90000,
    total_cost_cents: okTotal,
    status: "ok",
    people_count: 2,
    days_count: 7,
    stores_selected: ["store-alsuper", "store-walmart", "store-soriana"],
    savings_weight: 0.7,
    created_at: CREATED_AT,
  },
  meals: mealsFor("plan-ok"),
  shopping_items: okItems,
};

const closeItems = shoppingFor("plan-over-close");

/** Mismo plan, pero el presupuesto queda ~5% abajo del costo. */
export const planOverBudgetCloseFixture: PlanBundle = {
  plan: {
    ...planOkFixture.plan,
    id: "plan-over-close",
    budget_cents: 76500,
    total_cost_cents: totalOf(closeItems),
    status: "over_budget_close",
  },
  meals: mealsFor("plan-over-close"),
  shopping_items: closeItems,
};

/** Presupuesto muy por debajo de lo necesario: no hay plan que mostrar. */
export const planInfeasibleFixture: PlanBundle = {
  plan: {
    ...planOkFixture.plan,
    id: "plan-infeasible",
    budget_cents: 40000,
    total_cost_cents: okTotal,
    status: "infeasible_likely",
  },
  meals: [],
  shopping_items: [],
};

const pantryRows: Array<[canonicalProductId: string, remaining: number, unit: UnitType]> = [
  ["cp-arroz", 400, "mass_g"],
  ["cp-aceite", 800, "volume_ml"],
  ["cp-sal", 975, "mass_g"],
  ["cp-ajo", 22, "unit"],
  ["cp-huevo", 6, "unit"],
  ["cp-queso", 50, "mass_g"],
];

/** Sobrantes que quedarian en despensa despues de cerrar planOkFixture. */
export const pantryFixture: PantryInventory[] = pantryRows.map(([canonicalId, remaining, unit]) => ({
  id: `pantry-${canonicalId}`,
  user_id: USER_ID,
  canonical_product_id: canonicalId,
  remaining_quantity: remaining,
  unit,
  source_plan_id: "plan-ok",
  updated_at: CREATED_AT,
}));
