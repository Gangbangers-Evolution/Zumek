import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from "@expo-google-fonts/inter";
import { colors, typography } from "@zumek/design-tokens";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorState, LoadingState } from "../components/AsyncStates";
import { CatalogProvider, useCatalogState } from "../state/catalog";
import { OnboardingProvider } from "../state/onboarding";
import { WeekProvider } from "../state/week";

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
    <WeekProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.onSurface,
          headerTitleStyle: { ...typography.labelMd, color: colors.onSurfaceVariant },
          headerTitleAlign: "center",
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
          headerBackButtonDisplayMode: "minimal",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="generating" options={{ headerShown: false, gestureEnabled: false }} />
      </Stack>
    </WeekProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  // Si la fuente falla se sigue con la del sistema: no es motivo para bloquear la app.
  if (!fontsLoaded && !fontError) return null;
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <CatalogProvider>
        <OnboardingProvider>
          <CatalogGate />
        </OnboardingProvider>
      </CatalogProvider>
    </SafeAreaProvider>
  );
}
