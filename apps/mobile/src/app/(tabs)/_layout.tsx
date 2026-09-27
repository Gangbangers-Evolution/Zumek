import { colors, fontFamily } from "@zumek/design-tokens";
import { View } from "react-native";
import { BrandLockup } from "../../components/BrandLockup";
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
          ? { backgroundColor: colors.surfaceContainerLowest, borderTopColor: colors.outlineVariant, minHeight: 72, paddingTop: 8, paddingBottom: 8 }
          : { display: "none" },
        // Encabezado de marca como en los mockups; cada pantalla trae su propio titulo
        headerTitle: () => <BrandLockup compact />,
        headerTitleAlign: "left",
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
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
            tabBarIcon: ({ color, focused }) => <View style={{ width: 48, height: 30, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: focused ? colors.primarySoft : "transparent" }}><Icon name={icon} size={22} color={color} /></View>,
          }}
        />
      ))}
    </Tabs>
  );
}
