import { createMMKV } from "react-native-mmkv";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Gender, MemberSort } from "@/lib/api";

const STORAGE_KEY = "jipkok.memberFilter";

const storage = createMMKV();

type MemberFilterState = {
  sort: MemberSort;
  gender: Gender | null;
  setSort: (sort: MemberSort) => void;
  setGender: (gender: Gender | null) => void;
};

export const useMemberFilterStore = create<MemberFilterState>()(
  persist(
    (set) => ({
      sort: "RECENT",
      gender: null,
      setSort: (sort) => set({ sort }),
      setGender: (gender) => set({ gender }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => ({
        getItem: (key) => storage.getString(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
        removeItem: (key) => {
          storage.remove(key);
        },
      })),
      partialize: (state) => ({ sort: state.sort, gender: state.gender }),
    },
  ),
);
