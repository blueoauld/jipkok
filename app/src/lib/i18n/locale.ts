import { getLocales } from "expo-localization";

export const SUPPORTED_LOCALES = ["ko", "ja", "en"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const FALLBACK_LOCALE: SupportedLocale = "en";

function isSupported(code: string | null): code is SupportedLocale {
  return SUPPORTED_LOCALES.includes(code as SupportedLocale);
}

// 기기가 어떤 언어든 우리가 번역해 둔 것만 쓴다. 서버도 같은 목록만 받는다.
export function deviceLocale(): SupportedLocale {
  const code = getLocales()[0]?.languageCode ?? null;

  return isSupported(code) ? code : FALLBACK_LOCALE;
}
