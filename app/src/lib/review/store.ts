import * as StoreReview from "expo-store-review";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { storage } from "@/lib/storage";

const REVIEW_STORAGE_KEY = "jipkok.review";

const DAY_MILLIS = 24 * 60 * 60 * 1000;
const MIN_USAGE_MILLIS = 3 * DAY_MILLIS;
const REQUEST_INTERVAL_MILLIS = 90 * DAY_MILLIS;

type ReviewState = {
  firstSeenAt: number | null;
  lastRequestedAt: number | null;
  markFirstSeen: () => void;
  markRequested: () => void;
};

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      firstSeenAt: null,
      lastRequestedAt: null,
      markFirstSeen: () => {
        if (get().firstSeenAt === null) {
          set({ firstSeenAt: Date.now() });
        }
      },
      markRequested: () => set({ lastRequestedAt: Date.now() }),
    }),
    {
      name: REVIEW_STORAGE_KEY,
      storage,
      partialize: (state) => ({
        firstSeenAt: state.firstSeenAt,
        lastRequestedAt: state.lastRequestedAt,
      }),
    },
  ),
);

// 표시 여부는 OS가 정하므로 요청 시도 자체를 기록해 남용을 막는다.
export async function maybeRequestReview() {
  const { firstSeenAt, lastRequestedAt, markRequested } =
    useReviewStore.getState();
  const now = Date.now();

  if (firstSeenAt === null || now - firstSeenAt < MIN_USAGE_MILLIS) {
    return;
  }

  if (
    lastRequestedAt !== null &&
    now - lastRequestedAt < REQUEST_INTERVAL_MILLIS
  ) {
    return;
  }

  if (!(await StoreReview.hasAction())) {
    return;
  }

  markRequested();
  await StoreReview.requestReview().catch(() => undefined);
}
