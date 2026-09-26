import { colors, fontFamily, typography } from "@zumek/design-tokens";
import { Tabs } from "expo-router";
import { Icon, type IconName } from "../../components/Icon";
import { useWeek } from "../../state/week";

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: "index", title: "Inicio", icon: "home" },
  { name: "plan", title: "Plan", icon: "calendar" },
  { name: "shopping", title: "Compras", icon: "shoppingCart" },
  { name: "pantry", title: "Despensa", icon: "kitchen" },
  { name: "chat", title: "Chat", icon: "chat" },
];

export default function TabsLayout() {
  // Sin plan no hay nada que recorrer: la barra aparece al generar la primera semana.
  const { bundle } = useWeek();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarLabelStyle: { fontFamily: fontFamily.semibold, fontSize: 12 },
        tabBarStyle: bundle
          ? { backgroundColor: colors.surfaceContainerLowest, borderTopColor: colors.divider, minHeight: 60 }
          : { display: "none" },
        // Encabezado de marca como en los mockups; cada pantalla trae su propio titulo
        headerTitle: "Zumek",
        headerTitleAlign: "left",
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTitleStyle: { ...typography.headlineMd, color: colors.primary },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {TABS.map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            headerShown: name !== "index",
            tabBarAccessibilityLabel: title,
            tabBarIcon: ({ color }) => <Icon name={icon} size={24} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
