import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { type ReactNode, useEffect, useMemo } from "react";
import { Appearance } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { TamaguiProvider, Theme, useTheme, YStack } from "tamagui";

import { AppLockOverlay } from "@/components/AppLockOverlay";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { ToastHost } from "@/components/ToastHost";
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
import { type ThemeMode, useThemeStore } from "@/lib/theme/store";
import { tamaguiConfig } from "@/tamagui.config";

export { AppErrorBoundary as ErrorBoundary } from "@/components/AppErrorBoundary";

export default function RootLayout() {
  const scheme = useThemeStore((state) => state.mode);

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
                  <ToastHost />
                  <AppLockOverlay />
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
  scheme: ThemeMode;
  children: ReactNode;
}) {
  const theme = useTheme();
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;

  const navigationTheme = useMemo(
    () => ({
      ...base,
      colors: {
        ...base.colors,
        primary: theme.blue10.val,
        background: theme.background.val,
        card: theme.background.val,
        text: theme.color.val,
        border: theme.borderColor.val,
      },
    }),
    [base, theme],
  );

  return <ThemeProvider value={navigationTheme}>{children}</ThemeProvider>;
}
