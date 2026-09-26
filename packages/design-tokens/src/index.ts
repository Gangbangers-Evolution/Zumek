// Sistema de diseno "Warm Culinary Thrift" (mockups de Stitch, identidad verde salvia + durazno).
// Los nombres siguen el DESIGN.md para mapear 1:1 las clases de los mockups (bg-primary-container -> primaryContainer).
// Cada par texto/fondo que se usa en la app esta verificado con contraste >= 4.5:1.

export const colors = {
  // Verde salvia: acciones (identidad actual de Stitch). Texto blanco sobre #52796f (4.86:1).
  primaryContainer: "#52796f",
  onPrimaryContainer: "#ffffff",
  primaryContainerPressed: "#3d5a52", // mas oscuro al presionar: sube el contraste (7.55:1)
  primary: "#3f6158", // verde salvia oscuro para texto y numeros de acento
  onPrimary: "#ffffff",
  primaryFixed: "#dfe9e5", // fondo de chips y tarjetas seleccionadas
  onPrimaryFixedVariant: "#2c4640", // texto sobre primaryFixed

  // Coral y durazno: solo acentos (presupuesto, etiquetas, progreso de ahorro)
  accent: "#ae2f34",
  accentFixed: "#fbf0ec", // fondo de etiquetas de acento ("PLANIFICA & AHORRA")
  onAccentFixed: "#a8472c", // texto sobre accentFixed (5.21:1)
  peach: "#e29578", // solo relleno decorativo, nunca texto
  onPeachText: "#a34a30", // texto que acompana al durazno (5.31:1)

  // Verde: solo ahorro y logros de dinero
  secondary: "#006d3f",
  onSecondary: "#ffffff",
  secondaryContainer: "#8ff8b6",
  onSecondaryContainer: "#00522e", // (7.24:1)

  // Ambar: avisos (caducidad, presupuesto cerca del limite)
  tertiary: "#825500",
  tertiaryFixed: "#ffddb4",
  onTertiaryFixed: "#633f00", // (7.25:1)

  error: "#ba1a1a",
  errorContainer: "#ffdad6",
  onErrorContainer: "#93000a", // (7.24:1)

  // Superficies
  background: "#fcf9f8",
  surfaceContainerLowest: "#ffffff", // tarjetas
  surfaceContainerLow: "#f6f3f2",
  primarySoft: "#e8f1ee", // halo de la mascota y fondo del riel de progreso
  surfaceContainer: "#f0eded",
  surfaceContainerHigh: "#eae7e7",

  onSurface: "#1b1c1c",
  onSurfaceVariant: "#4e615d", // texto secundario (5.96:1 sobre surfaceContainerLow)
  outline: "#5f716c", // placeholder e iconos inactivos (>= 4.5:1 sobre blanco y el fondo)
  outlineVariant: "#d6e0dc", // bordes
  divider: "#e1e1de",
} as const;

// Inter en cuatro pesos; los nombres coinciden con las fuentes cargadas en apps/mobile.
export const fontFamily = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
} as const;

interface TextStyleToken {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
}

/** Escala tipografica del DESIGN.md (letterSpacing en px: em * fontSize). */
export const typography = {
  headlineXl: { fontFamily: fontFamily.bold, fontSize: 28, lineHeight: 36, letterSpacing: -0.56 },
  headlineLg: { fontFamily: fontFamily.bold, fontSize: 24, lineHeight: 32, letterSpacing: -0.36 },
  headlineMd: { fontFamily: fontFamily.semibold, fontSize: 20, lineHeight: 28, letterSpacing: -0.2 },
  headlineSm: { fontFamily: fontFamily.semibold, fontSize: 18, lineHeight: 24, letterSpacing: -0.09 },
  bodyLg: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24 },
  bodyMd: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20 },
  bodyMdMedium: { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 20 },
  labelMd: { fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 18 },
  labelSm: { fontFamily: fontFamily.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.12 },
  caption: { fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 16 },
  currencyDisplay: { fontFamily: fontFamily.bold, fontSize: 24, lineHeight: 28, letterSpacing: -0.48 },
  currencyHero: { fontFamily: fontFamily.bold, fontSize: 40, lineHeight: 48, letterSpacing: -0.8 },
} as const satisfies Record<string, TextStyleToken>;

export type TypographyVariant = keyof typeof typography;

/** Base de 4px. */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  control: 12, // botones, inputs
  card: 16,
  sheet: 20, // modales y hojas
  pill: 999, // chips y badges
} as const;

// Tamano minimo de elementos tocables (seccion 5, criterios verificables)
export const touchTarget = {
  min: 44,
  button: 48,
} as const;

export const layout = {
  // Ancho maximo del contenido en web (seccion 5)
  maxContentWidth: 480,
} as const;

// boxShadow funciona igual en iOS, Android y web (las props shadow* estan obsoletas en web).
export const elevation = {
  card: { boxShadow: "0 1px 3px rgba(32, 32, 32, 0.04)" },
  floating: { boxShadow: "0 4px 14px -2px rgba(32, 32, 32, 0.08)" },
} as const;

export const motion = {
  durationShort: 150,
  durationBase: 250,
  // Tope cuando el SO tiene 'reduced motion' activado
  durationReduced: 90,
} as const;

export const tokens = { colors, fontFamily, typography, spacing, radius, touchTarget, layout, elevation, motion } as const;
export type Tokens = typeof tokens;
