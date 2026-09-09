import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  FeedSort,
  Gender,
  MemberSort,
  WorryCategory,
  WorrySort,
} from "@/lib/api";
import { isKoreaToday, toDateParam } from "@/lib/date";
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

// 랭킹은 서버 정렬값이 아니라 다른 API를 타지만 화면에서는 같은 세그먼트에 놓인다.
export type MemberListSort = MemberSort | "RANK";

type MemberFilterState = MemberFilter & {
  sort: MemberListSort;
  setSort: (sort: MemberListSort) => void;
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

export type LoungeBoard = "FEED" | "WORRY";

type FeedFilterState = {
  board: LoungeBoard;
  sort: FeedSort;
  worrySort: WorrySort;
  // null이면 전체 분류다.
  worryCategory: WorryCategory | null;
  // null이면 오늘. 날짜를 박아 두면 자정이 지나도 어제에 머문다.
  date: string | null;
  setBoard: (board: LoungeBoard) => void;
  setSort: (sort: FeedSort) => void;
  setWorrySort: (worrySort: WorrySort) => void;
  setWorryCategory: (worryCategory: WorryCategory | null) => void;
  setDate: (date: Date) => void;
};

export const useFeedFilterStore = create<FeedFilterState>()(
  persist(
    (set) => ({
      board: "FEED",
      sort: DEFAULT_FEED_SORT,
      worrySort: "LATEST",
      worryCategory: null,
      date: null,
      setBoard: (board) => set({ board }),
      setSort: (sort) => set({ sort }),
      setWorrySort: (worrySort) => set({ worrySort }),
      setWorryCategory: (worryCategory) => set({ worryCategory }),
      setDate: (date) =>
        set({ date: isKoreaToday(date) ? null : toDateParam(date) }),
    }),
    {
      name: FEED_STORAGE_KEY,
      storage,
      version: 2,
      migrate: (persisted) => {
        const previous = persisted as { sort?: FeedSort } | undefined;

        return { sort: previous?.sort ?? DEFAULT_FEED_SORT };
      },
      partialize: (state) => ({
        board: state.board,
        sort: state.sort,
        worrySort: state.worrySort,
        worryCategory: state.worryCategory,
      }),
    },
  ),
);
