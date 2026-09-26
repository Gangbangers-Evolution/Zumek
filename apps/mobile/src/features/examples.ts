// DATOS DE EJEMPLO de los mockups (decision del equipo: mostrarlos como en el diseno).
// NO son calculos reales ni afectan al planner. Todo lo inventado vive SOLO en este archivo
// para poder quitarlo o reemplazarlo por datos reales sin buscar por toda la app.
import type { MealType } from "@zumek/domain";

export const EXAMPLES = {
  /** Bienvenida: login aun no existe (Fase 6.2, MVP OPTIONAL). */
  loginComingSoon: true,
  /** Presupuesto: consejo con un promedio inventado. */
  budgetTip: "Familias de 2 a 3 personas suelen ahorrar un promedio de $320.00 MXN semanales con este presupuesto.",
  /** Comidas: costo semanal aproximado por tipo de comida. */
  weeklyCostByMeal: { desayuno: "~$240 MXN / sem", comida: "~$620 MXN / sem", cena: "~$380 MXN / sem", snack: "Opcional semanal" } satisfies Record<MealType, string>,
  mealImpact: "Planificar desayunos y comidas reduce hasta un 35% el gasto en restaurantes.",
  /** Cocinas que aun no tienen recetas en el catalogo (elegirlas no cambia el plan). */
  extraCuisines: [
    { name: "Asiática", subtitle: "Woks, bowls y salteados" },
    { name: "Mediterránea", subtitle: "Aceite de oliva y granos" },
    { name: "Casera básica", subtitle: "Sopas, caldos y guisos" },
  ],
  cuisineTip: "Combinar cocina tradicional mexicana con recetas mediterráneas maximiza el uso de legumbres y verduras de temporada.",
  /** Dietas que el catalogo aun no etiqueta (elegirlas no cambia el plan). */
  extraDiets: ["Vegetariano", "Vegano", "Bajo en carbohidratos"],
  /** Generando: dato curioso con cifras inventadas. */
  generatingTip: "Planificar 7 días reduce el desperdicio de comida fresca hasta en un 40% y ahorra en promedio $320.00 MXN al mes.",
  /** Plan: "ahorro inteligente" contra comprar sin plan (no se calcula todavia). */
  smartSavingsCents: 34200,
  /** Receta: calorias por porcion. */
  kcalPerServing: 340,
  chefTip: "No dejes dorar demasiado la cebolla para que conserve su dulzor natural y aporte jugosidad al guisado.",
  /** Chat: comparativa nutricional del cambio propuesto. */
  proposalNote: "Comparativa nutricional: el cambio conserva las calorías requeridas por comida.",
} as const;
