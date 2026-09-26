// Valores PROVISIONALES: se reemplazan cuando el equipo de diseno entregue el mockup.
// Mientras tanto siguen la identidad conceptual (coral calido, verde ahorro, fondos claros).

export const colors = {
  // Coral/naranja calido: color principal de marca
  primary: "#E8603C",
  primaryPressed: "#C94E2D",
  primarySoft: "#FDE6DE",
  onPrimary: "#FFFFFF",

  // Verde: ahorro / exito
  success: "#2E8B57",
  successSoft: "#E3F4EA",
  onSuccess: "#FFFFFF",

  warning: "#B7791F",
  warningSoft: "#FDF3DC",
  danger: "#C53030",
  dangerSoft: "#FDE2E2",

  // Fondos claros
  background: "#FFF9F5",
  surface: "#FFFFFF",
  surfaceMuted: "#F6EEE8",
  border: "#EADFD7",

  textPrimary: "#2B2320",
  textSecondary: "#6B5E57",
  textDisabled: "#A89A92",
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

export const tokens = { colors, typography, spacing, radius, touchTarget } as const;
export type Tokens = typeof tokens;
