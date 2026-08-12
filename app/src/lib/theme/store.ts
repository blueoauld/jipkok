import { create } from "zustand";
import { persist } from "zustand/middleware";

import { storage } from "@/lib/storage";

const STORAGE_KEY = "jipkok.theme";

export type ThemeMode = "blue" | "pink" | "dark";

export type ColorScheme = "light" | "dark";

export function colorScheme(mode: ThemeMode): ColorScheme {
  return mode === "dark" ? "dark" : "light";
}

type ThemeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "blue",
      setMode: (mode) => set({ mode }),
    }),
    {
      name: STORAGE_KEY,
      storage,
      version: 1,
      migrate: (state) => {
        const { mode } = state as { mode?: string };

        return { mode: mode === "dark" ? "dark" : "blue" } as ThemeState;
      },
      partialize: (state) => ({ mode: state.mode }),
    },
  ),
);
