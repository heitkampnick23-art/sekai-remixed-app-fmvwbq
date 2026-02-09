
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { useColorScheme } from "react-native";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import React, { useEffect, useRef } from "react";
import { SystemBars } from "react-native-edge-to-edge";
import "react-native-reanimated";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { View, ActivityIndicator } from "react-native";

SplashScreen.preventAutoHideAsync();

// Auth guard component to handle navigation based on auth state
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (loading) {
      console.log("[AuthGuard] Still loading, waiting...");
      return;
    }

    const inAuthGroup = segments[0] === 'auth' || segments[0] === 'auth-popup' || segments[0] === 'auth-callback';

    console.log("[AuthGuard] Auth state:", { user: !!user, inAuthGroup, segments: segments.join('/') });

    // Prevent multiple navigations
    if (hasNavigated.current) {
      console.log("[AuthGuard] Already navigated, skipping");
      return;
    }

    if (!user && !inAuthGroup) {
      // Redirect to auth if not authenticated
      console.log("[AuthGuard] Not authenticated, redirecting to /auth");
      hasNavigated.current = true;
      router.replace('/auth');
    } else if (user && inAuthGroup) {
      // Redirect to home if authenticated and trying to access auth pages
      console.log("[AuthGuard] Authenticated in auth group, redirecting to home");
      hasNavigated.current = true;
      router.replace('/(tabs)/(home)');
    } else {
      console.log("[AuthGuard] No navigation needed");
    }
  }, [user, loading]);

  // Reset navigation flag when user state changes
  useEffect(() => {
    hasNavigated.current = false;
  }, [user]);

  if (loading) {
    console.log("[AuthGuard] Showing loading screen");
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F0F' }}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return <>{children}</>;
}

const CustomDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#8B5CF6',
    background: '#0F0F0F',
    card: '#1A1A1A',
    text: '#FFFFFF',
    border: '#2A2A2A',
    notification: '#8B5CF6',
  },
};

const CustomLightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#8B5CF6',
    background: '#FFFFFF',
    card: '#F5F5F5',
    text: '#000000',
    border: '#E5E5E5',
    notification: '#8B5CF6',
  },
};

export default function RootLayout() {
  const { isConnected } = useNetworkState();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  const colorScheme = useColorScheme();

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? CustomDarkTheme : CustomLightTheme}>
        <AuthProvider>
          <AuthGuard>
            <WidgetProvider>
              <SystemBars style={colorScheme === "dark" ? "light" : "dark"} />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="auth" options={{ headerShown: false }} />
                <Stack.Screen name="auth-popup" options={{ headerShown: false }} />
                <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="chat/[id]" options={{ headerShown: true, title: "Chat" }} />
                <Stack.Screen name="character/create" options={{ headerShown: true, title: "Create Character" }} />
                <Stack.Screen name="character/[id]" options={{ headerShown: true, title: "Character Details" }} />
                <Stack.Screen name="story/create" options={{ headerShown: true, title: "Create Story" }} />
                <Stack.Screen name="story/[id]" options={{ headerShown: true, title: "Story" }} />
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
            </WidgetProvider>
          </AuthGuard>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
