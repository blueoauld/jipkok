import { getLocales } from "expo-localization";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { storage } from "@/lib/storage";

export const SUPPORTED_COUNTRIES = ["KR", "JP"] as const;

export type PhoneCountry = (typeof SUPPORTED_COUNTRIES)[number];

const FALLBACK_COUNTRY: PhoneCountry = "KR";

// 두 나라 모두 국내 표기로는 11자리이고, 국가 코드를 붙일 때 앞의 0이 빠진다.
const RULES: Record<PhoneCountry, { dialCode: string; pattern: RegExp }> = {
  KR: { dialCode: "+82", pattern: /^010\d{8}$/ },
  JP: { dialCode: "+81", pattern: /^0[789]0\d{8}$/ },
};

export const PHONE_NUMBER_MAX_LENGTH = 11;

const STORAGE_KEY = "jipkok.phoneCountry";

function isSupported(code: string | null): code is PhoneCountry {
  return SUPPORTED_COUNTRIES.includes(code as PhoneCountry);
}

function deviceCountry(): PhoneCountry {
  const code = getLocales()[0]?.regionCode ?? null;

  return isSupported(code) ? code : FALLBACK_COUNTRY;
}

type PhoneCountryState = {
  // null이면 기기 지역을 따른다.
  country: PhoneCountry | null;
  setCountry: (country: PhoneCountry) => void;
};

export const usePhoneCountryStore = create<PhoneCountryState>()(
  persist(
    (set) => ({
      country: null,
      setCountry: (country) => set({ country }),
    }),
    {
      name: STORAGE_KEY,
      storage,
      version: 1,
    },
  ),
);

export function currentCountry(): PhoneCountry {
  return usePhoneCountryStore.getState().country ?? deviceCountry();
}

export function usePhoneCountry(): PhoneCountry {
  return usePhoneCountryStore((state) => state.country) ?? deviceCountry();
}

function dialCodeOf(country: PhoneCountry) {
  return RULES[country].dialCode;
}

export function patternOf(country: PhoneCountry) {
  return RULES[country].pattern;
}

// 서버는 국가 코드가 붙은 형식만 받는다. 화면은 국내 표기로 입력받아 여기서 바꾼다.
export function toE164(phoneNumber: string) {
  return dialCodeOf(currentCountry()) + phoneNumber.slice(1);
}
