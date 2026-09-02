import { create } from "zustand";
import { persist } from "zustand/middleware";

import { deviceCountry, type PhoneCountry } from "@/lib/phone/country";
import { storage } from "@/lib/storage";

const STORAGE_KEY = "jipkok.phoneCountry";

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
