import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { TamaguiProvider, useTheme } from "tamagui";

import { useChatSocket } from "@/hooks/useChatSocket";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { QueryProvider } from "@/lib/query";
import { tamaguiConfig } from "@/tamagui.config";

export default function RootLayout() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";

  return (
    <QueryProvider>
      <KeyboardProvider>
        <TamaguiProvider config={tamaguiConfig} defaultTheme={scheme}>
          <NavigationTheme scheme={scheme}>
            <StatusBar style={scheme === "dark" ? "light" : "dark"} />
            <SessionGuard />
            <ChatSocket />
            <Stack screenOptions={{ headerShown: false }} />
          </NavigationTheme>
        </TamaguiProvider>
      </KeyboardProvider>
    </QueryProvider>
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
