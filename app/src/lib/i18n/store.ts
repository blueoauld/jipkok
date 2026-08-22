import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { SupportedLocale } from "@/lib/i18n/locale";
import { storage } from "@/lib/storage";

const STORAGE_KEY = "jipkok.locale";

type LocaleState = {
  // null이면 기기 언어를 따른다.
  locale: SupportedLocale | null;
  setLocale: (locale: SupportedLocale) => void;
};

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: null,
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: STORAGE_KEY,
      storage,
      version: 1,
    },
  ),
);
