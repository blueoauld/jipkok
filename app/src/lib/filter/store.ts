import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { FeedSort, Gender, MemberSort } from "@/lib/api";
import { toDateParam } from "@/lib/date";
import { storage } from "@/lib/storage";

const MEMBER_STORAGE_KEY = "jipkok.memberFilter";
const FEED_STORAGE_KEY = "jipkok.feedFilter";

const DEFAULT_FEED_SORT: FeedSort = "LATEST";

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
  sort: FeedSort;
  gender: Gender | null;
  date: string;
  setSort: (sort: FeedSort) => void;
  setGender: (gender: Gender | null) => void;
  setDate: (date: Date) => void;
};

export const useFeedFilterStore = create<FeedFilterState>()(
  persist(
    (set) => ({
      sort: DEFAULT_FEED_SORT,
      gender: null,
      date: toDateParam(new Date()),
      setSort: (sort) => set({ sort }),
      setGender: (gender) => set({ gender }),
      setDate: (date) => set({ date: toDateParam(date) }),
    }),
    {
      name: FEED_STORAGE_KEY,
      storage,
      version: 1,
      migrate: (persisted) => {
        const previous = persisted as
          { sort?: FeedSort; gender?: Gender | null } | undefined;

        return {
          sort: previous?.sort ?? DEFAULT_FEED_SORT,
          gender: previous?.gender ?? null,
        };
      },
      partialize: (state) => ({ sort: state.sort, gender: state.gender }),
    },
  ),
);
