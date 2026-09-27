import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from "@expo-google-fonts/inter";
import { colors, typography } from "@zumek/design-tokens";
import { Stack } from "expo-router";
import { View } from "react-native";
import { LoadingArtwork } from "../components/LoadingArtwork";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LoadErrorCard, StartupScreen, SyncCard } from "../features/welcome/StartupScreen";
import { CatalogProvider, useCatalogState } from "../state/catalog";
import { OnboardingProvider } from "../state/onboarding";
import { WeekProvider } from "../state/week";

function CatalogGate() {
  const { state, retry } = useCatalogState();
  // Carga y error viven dentro de la misma pantalla de bienvenida, como en el mockup.
  if (state.status === "loading") {
    return (
      <StartupScreen>
        <SyncCard />
      </StartupScreen>
    );
  }
  if (state.status === "error") {
    return (
      <StartupScreen>
        <LoadErrorCard onRetry={retry} />
      </StartupScreen>
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
  if (!fontsLoaded && !fontError) return (
    <SafeAreaProvider>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: colors.background }}>
        <LoadingArtwork label="Bienvenido a Zumek…" />
      </View>
    </SafeAreaProvider>
  );
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
