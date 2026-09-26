import type { Catalog } from "../src/index";
import {
  canonicalProductsFixture,
  colloquialUnitsFixture,
  commercialProductsFixture,
  priceObservationsFixture,
  storesFixture,
} from "./products.fixture";
import { recipeIngredientsFixture, recipeStepsFixture, recipesFixture } from "./recipes.fixture";

export * from "./products.fixture";
export * from "./recipes.fixture";
export * from "./plan.fixture";

export const catalogFixture: Catalog = {
  stores: storesFixture,
  canonical_products: canonicalProductsFixture,
  commercial_products: commercialProductsFixture,
  latest_prices: priceObservationsFixture,
  colloquial_units: colloquialUnitsFixture,
  recipes: recipesFixture,
  recipe_steps: recipeStepsFixture,
  recipe_ingredients: recipeIngredientsFixture,
};
