import { create } from "zustand";
import { persist } from "zustand/middleware";

import { storage } from "@/lib/storage";

const STORAGE_KEY = "jipkok.theme";

export type ThemeMode = "light" | "dark";

type ThemeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "light",
      setMode: (mode) => set({ mode }),
    }),
    {
      name: STORAGE_KEY,
      storage,
      partialize: (state) => ({ mode: state.mode }),
    },
  ),
);
