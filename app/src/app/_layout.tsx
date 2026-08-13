import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { type ReactNode, useEffect, useMemo } from "react";
import { Appearance } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { TamaguiProvider, Theme, useTheme, YStack } from "tamagui";

import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useChatSocket } from "@/hooks/useChatSocket";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useScreenTracking } from "@/hooks/useScreenTracking";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { initializeAds } from "@/lib/ads";
import { initializeAnalytics } from "@/lib/analytics";
import { initializeCrashReporting } from "@/lib/crash";
import { initializePerformanceMonitoring } from "@/lib/performance";
import { QueryProvider } from "@/lib/query";
import { useReviewStore } from "@/lib/review/store";
import { useAccentColor, useThemeBackgroundColor } from "@/lib/theme/accent";
import {
  type ColorScheme,
  colorScheme,
  useThemeStore,
} from "@/lib/theme/store";
import { tamaguiConfig } from "@/tamagui.config";

export default function RootLayout() {
  const mode = useThemeStore((state) => state.mode);
  const scheme = colorScheme(mode);

  useEffect(() => {
    Appearance.setColorScheme(scheme);
  }, [scheme]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <KeyboardProvider>
          <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
            <Theme name={scheme}>
              <NavigationTheme scheme={scheme}>
                <StatusBar style={scheme === "dark" ? "light" : "dark"} />
                <SessionGuard />
                <ChatSocket />
                <Push />
                <Ads />
                <Analytics />
                <CrashReporting />
                <Performance />
                <Review />
                <YStack flex={1}>
                  <Stack screenOptions={{ headerShown: false }} />
                  <LoadingOverlay />
                </YStack>
              </NavigationTheme>
            </Theme>
          </TamaguiProvider>
        </KeyboardProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}

function SessionGuard() {
  useSessionGuard();

  return null;
}

function ChatSocket() {
  useChatSocket();

  return null;
}

function Push() {
  usePushNotifications();

  return null;
}

function Ads() {
  useEffect(() => {
    initializeAds();
  }, []);

  return null;
}

function Review() {
  const markFirstSeen = useReviewStore((state) => state.markFirstSeen);

  useEffect(() => {
    markFirstSeen();
  }, [markFirstSeen]);

  return null;
}

function Performance() {
  useEffect(() => {
    initializePerformanceMonitoring();
  }, []);

  return null;
}

function CrashReporting() {
  useEffect(() => {
    initializeCrashReporting();
  }, []);

  return null;
}

function Analytics() {
  useEffect(() => {
    initializeAnalytics();
  }, []);

  useScreenTracking();

  return null;
}

function NavigationTheme({
  scheme,
  children,
}: {
  scheme: ColorScheme;
  children: ReactNode;
}) {
  const theme = useTheme();
  const accent = useAccentColor();
  const background = useThemeBackgroundColor();
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;

  const navigationTheme = useMemo(
    () => ({
      ...base,
      colors: {
        ...base.colors,
        primary: accent,
        background,
        card: background,
        text: theme.color.val,
        border: theme.borderColor.val,
      },
    }),
    [accent, background, base, theme],
  );

  return <ThemeProvider value={navigationTheme}>{children}</ThemeProvider>;
}
