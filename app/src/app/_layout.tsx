import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { type ReactNode, useEffect, useMemo } from "react";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { TamaguiProvider, useTheme, YStack } from "tamagui";

import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useChatSocket } from "@/hooks/useChatSocket";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useScreenTracking } from "@/hooks/useScreenTracking";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { initializeAds } from "@/lib/ads";
import { initializeAnalytics } from "@/lib/analytics";
import { QueryProvider } from "@/lib/query";
import { tamaguiConfig } from "@/tamagui.config";

export default function RootLayout() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <KeyboardProvider>
          <TamaguiProvider config={tamaguiConfig} defaultTheme={scheme}>
            <NavigationTheme scheme={scheme}>
              <StatusBar style={scheme === "dark" ? "light" : "dark"} />
              <SessionGuard />
              <ChatSocket />
              <Push />
              <Ads />
              <Analytics />
              <YStack flex={1}>
                <Stack screenOptions={{ headerShown: false }} />
                <LoadingOverlay />
              </YStack>
            </NavigationTheme>
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
  scheme: "light" | "dark";
  children: ReactNode;
}) {
  const theme = useTheme();
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;

  const navigationTheme = useMemo(
    () => ({
      ...base,
      colors: {
        ...base.colors,
        primary: theme.accentBackground.val,
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
