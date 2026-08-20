import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { FeedSort, Gender, MemberSort } from "@/lib/api";
import { isToday, toDateParam } from "@/lib/date";
import { storage } from "@/lib/storage";
import { MAX_AGE, MIN_AGE } from "@/lib/validation";

const MEMBER_STORAGE_KEY = "jipkok.memberFilter";
const FEED_STORAGE_KEY = "jipkok.feedFilter";

const DEFAULT_FEED_SORT: FeedSort = "LATEST";

export type MemberFilter = {
  gender: Gender | null;
  minAge: number;
  maxAge: number;
};

export const DEFAULT_MEMBER_FILTER: MemberFilter = {
  gender: null,
  minAge: MIN_AGE,
  maxAge: MAX_AGE,
};

export function isDefaultMemberFilter(filter: MemberFilter) {
  return (
    filter.gender === DEFAULT_MEMBER_FILTER.gender &&
    filter.minAge === DEFAULT_MEMBER_FILTER.minAge &&
    filter.maxAge === DEFAULT_MEMBER_FILTER.maxAge
  );
}

type MemberFilterState = MemberFilter & {
  sort: MemberSort;
  setSort: (sort: MemberSort) => void;
  setFilter: (filter: MemberFilter) => void;
};

export const useMemberFilterStore = create<MemberFilterState>()(
  persist(
    (set) => ({
      sort: "RECENT",
      ...DEFAULT_MEMBER_FILTER,
      setSort: (sort) => set({ sort }),
      setFilter: (filter) => set(filter),
    }),
    {
      name: MEMBER_STORAGE_KEY,
      storage,
      partialize: (state) => ({
        sort: state.sort,
        gender: state.gender,
        minAge: state.minAge,
        maxAge: state.maxAge,
      }),
    },
  ),
);

type FeedFilterState = {
  sort: FeedSort;
  // null이면 오늘. 날짜를 박아 두면 자정이 지나도 어제에 머문다.
  date: string | null;
  setSort: (sort: FeedSort) => void;
  setDate: (date: Date) => void;
};

export const useFeedFilterStore = create<FeedFilterState>()(
  persist(
    (set) => ({
      sort: DEFAULT_FEED_SORT,
      date: null,
      setSort: (sort) => set({ sort }),
      setDate: (date) =>
        set({ date: isToday(date) ? null : toDateParam(date) }),
    }),
    {
      name: FEED_STORAGE_KEY,
      storage,
      version: 2,
      migrate: (persisted) => {
        const previous = persisted as { sort?: FeedSort } | undefined;

        return { sort: previous?.sort ?? DEFAULT_FEED_SORT };
      },
      partialize: (state) => ({ sort: state.sort }),
    },
  ),
);
