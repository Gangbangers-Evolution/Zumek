import { colors } from "@zumek/design-tokens";
import { SymbolView } from "expo-symbols";
import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";

type SymbolName = ComponentProps<typeof SymbolView>["name"];

// Iconos de los mockups (Material Symbols en Android y web) con su equivalente SF Symbol
// en iOS. Agregar aqui cualquier icono nuevo: las pantallas solo usan estos nombres.
const ICONS = {
  add: { ios: "plus", android: "add", web: "add" },
  arrowBack: { ios: "chevron.left", android: "arrow_back", web: "arrow_back" },
  arrowForward: { ios: "arrow.right", android: "arrow_forward", web: "arrow_forward" },
  calendar: { ios: "calendar", android: "calendar_month", web: "calendar_month" },
  chat: { ios: "bubble.left", android: "chat_bubble", web: "chat_bubble" },
  check: { ios: "checkmark", android: "check", web: "check" },
  checkCircle: { ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" },
  chevronRight: { ios: "chevron.right", android: "chevron_right", web: "chevron_right" },
  close: { ios: "xmark", android: "close", web: "close" },
  eco: { ios: "leaf", android: "eco", web: "eco" },
  group: { ios: "person.2", android: "group", web: "group" },
  home: { ios: "house", android: "home", web: "home" },
  kitchen: { ios: "refrigerator", android: "kitchen", web: "kitchen" },
  lock: { ios: "lock", android: "lock", web: "lock" },
  lightbulb: { ios: "lightbulb", android: "lightbulb", web: "lightbulb" },
  pause: { ios: "pause.fill", android: "pause", web: "pause" },
  play: { ios: "play.fill", android: "play_arrow", web: "play_arrow" },
  refresh: { ios: "arrow.clockwise", android: "refresh", web: "refresh" },
  remove: { ios: "minus", android: "remove", web: "remove" },
  restaurant: { ios: "fork.knife", android: "restaurant", web: "restaurant" },
  savings: { ios: "banknote", android: "savings", web: "savings" },
  schedule: { ios: "clock", android: "schedule", web: "schedule" },
  search: { ios: "magnifyingglass", android: "search", web: "search" },
  send: { ios: "paperplane.fill", android: "send", web: "send" },
  shoppingCart: { ios: "cart", android: "shopping_cart", web: "shopping_cart" },
  smartToy: { ios: "sparkles", android: "smart_toy", web: "smart_toy" },
  store: { ios: "storefront", android: "storefront", web: "storefront" },
  timer: { ios: "timer", android: "timer", web: "timer" },
  trendingDown: { ios: "chart.line.downtrend.xyaxis", android: "trending_down", web: "trending_down" },
  tune: { ios: "slider.horizontal.3", android: "tune", web: "tune" },
  warning: { ios: "exclamationmark.triangle", android: "warning", web: "warning" },
  wifiOff: { ios: "wifi.slash", android: "cloud_off", web: "cloud_off" },
  sunny: { ios: "sun.max", android: "light_mode", web: "light_mode" },
  moon: { ios: "moon", android: "dark_mode", web: "dark_mode" },
  cookie: { ios: "carrot", android: "cookie", web: "cookie" },
  flag: { ios: "flag", android: "flag", web: "flag" },
  shield: { ios: "shield", android: "shield", web: "shield" },
  bolt: { ios: "bolt", android: "bolt", web: "bolt" },
  wallet: { ios: "wallet.pass", android: "account_balance_wallet", web: "account_balance_wallet" },
  delete: { ios: "trash", android: "delete", web: "delete" },
} satisfies Record<string, SymbolName>;

export type IconName = keyof typeof ICONS;

/** Icono decorativo: el significado siempre va tambien en texto o accessibilityLabel. */
export function Icon({ name, size = 20, color = colors.onSurfaceVariant }: { name: IconName; size?: number; color?: ColorValue }) {
  return (
    <SymbolView
      name={ICONS[name]}
      size={size}
      tintColor={color}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
