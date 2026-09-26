import { colors, typography } from "@zumek/design-tokens";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorState, LoadingState } from "../components/AsyncStates";
import { CatalogProvider, useCatalogState } from "../state/catalog";
import { OnboardingProvider } from "../state/onboarding";
import { PlanProvider } from "../state/plan";

function CatalogGate() {
  const { state, retry } = useCatalogState();
  if (state.status === "loading") return <LoadingState message="Cargando recetas y precios…" />;
  if (state.status === "error") {
    return (
      <ErrorState
        title="No pudimos cargar los datos"
        message="Revisa tu conexión a internet e inténtalo de nuevo."
        onRetry={retry}
      />
    );
  }
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.textPrimary, fontWeight: typography.fontWeight.semibold },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="generating" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="plan" options={{ title: "Tu plan" }} />
      <Stack.Screen name="shopping" options={{ title: "Lista de compras" }} />
      <Stack.Screen name="pantry" options={{ title: "Mi despensa" }} />
      <Stack.Screen name="chat" options={{ title: "Pregúntale a Zumek" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <CatalogProvider>
        <OnboardingProvider>
          <PlanProvider>
            <CatalogGate />
          </PlanProvider>
        </OnboardingProvider>
      </CatalogProvider>
    </SafeAreaProvider>
  );
}
