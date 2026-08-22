import { getLocales } from "expo-localization";
import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import { ja } from "@/lib/i18n/ja";
import { ko } from "@/lib/i18n/ko";

export const SUPPORTED_LOCALES = ["ko", "ja"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const FALLBACK_LOCALE: SupportedLocale = "ko";

function isSupported(code: string | null): code is SupportedLocale {
  return SUPPORTED_LOCALES.includes(code as SupportedLocale);
}

// 기기가 어떤 언어든 우리가 번역해 둔 것만 쓴다. 서버도 같은 목록만 받는다.
export function deviceLocale(): SupportedLocale {
  const code = getLocales()[0]?.languageCode ?? null;

  return isSupported(code) ? code : FALLBACK_LOCALE;
}

const i18n = createInstance();

i18n.use(initReactI18next).init({
  resources: { ko: { translation: ko }, ja: { translation: ja } },
  lng: deviceLocale(),
  fallbackLng: FALLBACK_LOCALE,
  interpolation: { escapeValue: false },
});

declare module "i18next" {
  interface CustomTypeOptions {
    resources: { translation: typeof ko };
  }
}

export default i18n;
