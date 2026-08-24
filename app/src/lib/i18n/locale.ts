import { getLocales, type Locale } from "expo-localization";

export const SUPPORTED_LOCALES = ["ko", "ja", "en", "zh"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const FALLBACK_LOCALE: SupportedLocale = "en";

const TRADITIONAL_CHINESE_REGIONS = ["TW", "HK", "MO"];

function isSupported(code: string | null): code is SupportedLocale {
  return SUPPORTED_LOCALES.includes(code as SupportedLocale);
}

// 중국어 번역은 번체라 간체 기기는 영어로 보낸다.
function isTraditionalChinese(locale: Locale) {
  return (
    locale.languageTag.includes("Hant") ||
    TRADITIONAL_CHINESE_REGIONS.includes(locale.regionCode ?? "")
  );
}

// 기기가 어떤 언어든 우리가 번역해 둔 것만 쓴다. 서버도 같은 목록만 받는다.
export function deviceLocale(): SupportedLocale {
  const locale = getLocales()[0];
  const code = locale?.languageCode ?? null;

  if (code === "zh") {
    return isTraditionalChinese(locale) ? "zh" : FALLBACK_LOCALE;
  }

  return isSupported(code) ? code : FALLBACK_LOCALE;
}
