import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Gender, MemberSort } from "@/lib/api";
import { storage } from "@/lib/storage";

const MEMBER_STORAGE_KEY = "jipkok.memberFilter";
const FEED_STORAGE_KEY = "jipkok.feedFilter";

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
      name: MEMBER_STORAGE_KEY,
      storage,
      partialize: (state) => ({ sort: state.sort, gender: state.gender }),
    },
  ),
);

type FeedFilterState = {
  gender: Gender | null;
  setGender: (gender: Gender | null) => void;
};

export const useFeedFilterStore = create<FeedFilterState>()(
  persist(
    (set) => ({
      gender: null,
      setGender: (gender) => set({ gender }),
    }),
    {
      name: FEED_STORAGE_KEY,
      storage,
      partialize: (state) => ({ gender: state.gender }),
    },
  ),
);
