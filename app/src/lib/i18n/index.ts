import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import { ja } from "@/lib/i18n/ja";
import { ko } from "@/lib/i18n/ko";
import { deviceLocale, type SupportedLocale } from "@/lib/i18n/locale";
import { useLocaleStore } from "@/lib/i18n/store";

export type { SupportedLocale } from "@/lib/i18n/locale";
export { deviceLocale, SUPPORTED_LOCALES } from "@/lib/i18n/locale";

// 고른 언어가 있으면 그것을, 없으면 기기 언어를 쓴다.
export function currentLocale(): SupportedLocale {
  return useLocaleStore.getState().locale ?? deviceLocale();
}

const i18n = createInstance();

i18n.use(initReactI18next).init({
  resources: { ko: { translation: ko }, ja: { translation: ja } },
  lng: currentLocale(),
  fallbackLng: "ko",
  interpolation: { escapeValue: false },
});

declare module "i18next" {
  interface CustomTypeOptions {
    resources: { translation: typeof ko };
  }
}

export default i18n;
