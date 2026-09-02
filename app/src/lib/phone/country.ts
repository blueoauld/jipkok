import { getLocales } from "expo-localization";

export const SUPPORTED_COUNTRIES = ["KR", "JP", "TW"] as const;

export type PhoneCountry = (typeof SUPPORTED_COUNTRIES)[number];

const FALLBACK_COUNTRY: PhoneCountry = "KR";

function isSupported(code: string | null): code is PhoneCountry {
  return SUPPORTED_COUNTRIES.includes(code as PhoneCountry);
}

export function deviceCountry(): PhoneCountry {
  const code = getLocales()[0]?.regionCode ?? null;

  return isSupported(code) ? code : FALLBACK_COUNTRY;
}
