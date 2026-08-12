import { useTheme } from "tamagui";

import { useThemeStore } from "@/lib/theme/store";

export type Accent = "blue" | "pink";

export function useAccent(): Accent {
  return useThemeStore((state) => (state.mode === "pink" ? "pink" : "blue"));
}

export function useAccentToken() {
  return useAccent() === "pink" ? ("$pink10" as const) : ("$blue10" as const);
}

export function useAccentColor() {
  const theme = useTheme();

  return useAccent() === "pink" ? theme.pink10.val : theme.blue10.val;
}

function useIsPink() {
  return useThemeStore((state) => state.mode === "pink");
}

export function useThemeBackground() {
  return useIsPink() ? ("$backgroundPink" as const) : ("$background" as const);
}

export function useThemeBackgroundColor() {
  const theme = useTheme();

  return useIsPink() ? theme.backgroundPink.val : theme.background.val;
}
