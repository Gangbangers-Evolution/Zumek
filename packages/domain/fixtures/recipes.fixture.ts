import type { Recipe, RecipeIngredient, RecipeStep, UnitType } from "../src/index";

interface RecipeSeed {
  recipe: Recipe;
  steps: Array<[title: string, content: string, timerSeconds: number | null]>;
  ingredients: Array<[canonicalProductId: string, quantity: number, unit: UnitType]>;
}

const seeds: RecipeSeed[] = [
  {
    recipe: {
      id: "rec-tacos-pollo",
      name: "Tacos de pollo",
      cuisine: "Mexicana",
      meal_type: ["comida", "cena"],
      tags: ["rapida", "alta en proteina"],
      prep_time_minutes: 25,
      servings_base: 4,
      allergens: [],
    },
    steps: [
      ["Cocer el pollo", "Pon la pechuga en una olla con agua y sal. Deja hervir a fuego medio.", 900],
      ["Deshebrar", "Saca el pollo, deja que se enfrie un poco y deshebralo con dos tenedores.", null],
      ["Picar", "Pica la cebolla y el cilantro finamente.", null],
      ["Calentar tortillas", "Calienta las tortillas en un comal con un poco de aceite y arma los tacos.", 120],
    ],
    ingredients: [
      ["cp-pollo", 500, "mass_g"],
      ["cp-tortilla", 400, "mass_g"],
      ["cp-cebolla", 1, "unit"],
      ["cp-cilantro", 20, "mass_g"],
      ["cp-aceite", 15, "volume_ml"],
      ["cp-sal", 2, "mass_g"],
    ],
  },
  {
    recipe: {
      id: "rec-arroz-pollo",
      name: "Arroz con pollo",
      cuisine: "Mexicana",
      meal_type: ["comida"],
      tags: ["alta en proteina"],
      prep_time_minutes: 45,
      servings_base: 4,
      allergens: [],
    },
    steps: [
      ["Dorar el arroz", "Calienta el aceite y dora el arroz hasta que se vea transparente.", 300],
      ["Licuar", "Licua el jitomate con la cebolla, el ajo y una taza de agua.", null],
      ["Cocer", "Agrega el licuado, el pollo en trozos y sal. Tapa y cocina a fuego bajo.", 1500],
      ["Reposar", "Apaga el fuego y deja reposar tapado antes de servir.", 300],
    ],
    ingredients: [
      ["cp-pollo", 400, "mass_g"],
      ["cp-arroz", 300, "mass_g"],
      ["cp-jitomate", 250, "mass_g"],
      ["cp-cebolla", 1, "unit"],
      ["cp-ajo", 2, "unit"],
      ["cp-aceite", 30, "volume_ml"],
      ["cp-sal", 3, "mass_g"],
    ],
  },
  {
    recipe: {
      id: "rec-huevos-mexicana",
      name: "Huevos a la mexicana",
      cuisine: "Mexicana",
      meal_type: ["desayuno", "cena"],
      tags: ["rapida", "economica"],
      prep_time_minutes: 15,
      servings_base: 2,
      allergens: ["huevo"],
    },
    steps: [
      ["Picar", "Pica el jitomate, la cebolla y el chile serrano.", null],
      ["Sofreir", "Sofrie la verdura en aceite caliente.", 180],
      ["Agregar huevo", "Agrega los huevos batidos con sal y mueve hasta que cuajen.", 240],
    ],
    ingredients: [
      ["cp-huevo", 4, "unit"],
      ["cp-jitomate", 150, "mass_g"],
      ["cp-cebolla", 0.5, "unit"],
      ["cp-serrano", 1, "unit"],
      ["cp-aceite", 10, "volume_ml"],
      ["cp-sal", 1, "mass_g"],
    ],
  },
  {
    recipe: {
      id: "rec-pasta-jitomate",
      name: "Spaghetti con jitomate",
      cuisine: "Italiana",
      meal_type: ["comida", "cena"],
      tags: ["economica"],
      prep_time_minutes: 30,
      servings_base: 4,
      allergens: ["gluten", "lacteos"],
    },
    steps: [
      ["Cocer la pasta", "Hierve agua con sal y cuece la pasta.", 600],
      ["Salsa", "Sofrie el ajo en aceite, agrega el jitomate picado y cocina hasta que espese.", 600],
      ["Servir", "Mezcla la pasta con la salsa y sirve con queso desmoronado.", null],
    ],
    ingredients: [
      ["cp-pasta", 400, "mass_g"],
      ["cp-jitomate", 500, "mass_g"],
      ["cp-ajo", 2, "unit"],
      ["cp-aceite", 30, "volume_ml"],
      ["cp-sal", 3, "mass_g"],
      ["cp-queso", 100, "mass_g"],
    ],
  },
  {
    recipe: {
      id: "rec-enfrijoladas",
      name: "Enfrijoladas",
      cuisine: "Mexicana",
      meal_type: ["comida", "cena"],
      tags: ["economica"],
      prep_time_minutes: 35,
      servings_base: 4,
      allergens: ["lacteos"],
    },
    steps: [
      ["Licuar frijoles", "Licua los frijoles cocidos con un poco de su caldo y cebolla.", null],
      ["Calentar salsa", "Calienta el licuado en una olla con sal hasta que hierva.", 300],
      ["Pasar tortillas", "Pasa las tortillas por aceite caliente y luego por la salsa de frijol.", null],
      ["Servir", "Dobla las tortillas y sirve con crema y queso.", null],
    ],
    ingredients: [
      ["cp-frijol", 300, "mass_g"],
      ["cp-tortilla", 400, "mass_g"],
      ["cp-queso", 150, "mass_g"],
      ["cp-crema", 100, "volume_ml"],
      ["cp-cebolla", 0.5, "unit"],
      ["cp-aceite", 20, "volume_ml"],
      ["cp-sal", 3, "mass_g"],
    ],
  },
  {
    recipe: {
      id: "rec-avena-platano",
      name: "Avena con platano",
      cuisine: "Mexicana",
      meal_type: ["desayuno"],
      tags: ["rapida", "economica"],
      prep_time_minutes: 10,
      servings_base: 2,
      allergens: ["lacteos"],
    },
    steps: [
      ["Hervir", "Calienta la leche con la avena a fuego medio moviendo seguido.", 420],
      ["Servir", "Sirve y agrega el platano en rodajas.", null],
    ],
    ingredients: [
      ["cp-avena", 100, "mass_g"],
      ["cp-leche", 500, "volume_ml"],
      ["cp-platano", 2, "unit"],
    ],
  },
];

export const recipesFixture: Recipe[] = seeds.map((s) => s.recipe);

export const recipeStepsFixture: RecipeStep[] = seeds.flatMap((s) =>
  s.steps.map(([title, content, timerSeconds], i) => ({
    id: `${s.recipe.id}-step-${i + 1}`,
    recipe_id: s.recipe.id,
    step_order: i + 1,
    title,
    content,
    timer_seconds: timerSeconds,
  })),
);

export const recipeIngredientsFixture: RecipeIngredient[] = seeds.flatMap((s) =>
  s.ingredients.map(([canonicalProductId, quantity, unit]) => ({
    id: `${s.recipe.id}-${canonicalProductId}`,
    recipe_id: s.recipe.id,
    canonical_product_id: canonicalProductId,
    quantity,
    unit,
  })),
);
