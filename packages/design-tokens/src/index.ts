// Valores PROVISIONALES: se reemplazan cuando el equipo de diseno entregue el mockup.
// Mientras tanto siguen la identidad conceptual (coral calido, verde ahorro, fondos claros).

// Pares texto/fondo verificados con contraste >= 4.5:1 (seccion 5).
export const colors = {
  // Coral/naranja calido: color principal de marca
  brandCoral: "#E8603C", // solo decorativo, no para texto ni fondo de texto blanco
  primary: "#C24A2B", // botones y texto de acento (4.87:1 con blanco)
  primaryPressed: "#A33D22",
  primarySoft: "#FDE6DE",
  onPrimarySoft: "#A93F24",
  onPrimary: "#FFFFFF",

  // Verde: ahorro / exito
  success: "#23764A",
  successSoft: "#E3F4EA",
  onSuccess: "#FFFFFF",

  warning: "#8A5A12",
  warningSoft: "#FDF3DC",
  danger: "#B42828",
  dangerSoft: "#FDE2E2",

  // Fondos claros
  background: "#FFF9F5",
  surface: "#FFFFFF",
  surfaceMuted: "#F6EEE8",
  border: "#EADFD7",

  textPrimary: "#2B2320",
  textSecondary: "#6B5E57",
  textDisabled: "#A89A92", // solo controles deshabilitados (exentos de contraste)
} as const;

export const typography = {
  fontFamily: {
    regular: "System",
    medium: "System",
    bold: "System",
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  fontWeight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

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
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

// Tamano minimo de elementos tocables (seccion 5, criterios verificables)
export const touchTarget = {
  min: 44,
} as const;

export const layout = {
  // Ancho maximo del contenido en web (seccion 5)
  maxContentWidth: 480,
} as const;

export const motion = {
  durationShort: 150,
  durationBase: 250,
  // Tope cuando el SO tiene 'reduced motion' activado
  durationReduced: 90,
} as const;

export const tokens = { colors, typography, spacing, radius, touchTarget, layout, motion } as const;
export type Tokens = typeof tokens;
