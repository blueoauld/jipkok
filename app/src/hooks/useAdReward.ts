import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useRewardedAd } from "react-native-google-mobile-ads";

import { useMyProfile } from "@/hooks/useMyProfile";
import { POINT_BALANCE_KEY, POINT_HISTORIES_KEY } from "@/hooks/usePoints";
import { REWARDED_AD_UNIT_ID } from "@/lib/ads";
import { api } from "@/lib/api";
import i18n from "@/lib/i18n";
import { showToast } from "@/lib/toast/store";

// 보상은 광고 서버가 우리 서버로 콜백을 보내야 들어오므로 시청 직후엔 아직 없을 수 있다.
const REWARD_POLL_INTERVAL = 2000;
const REWARD_POLL_COUNT = 6;
const DAILY_LIMIT = 5;

const REWARD_MESSAGE = i18n.t("hook.adRewarded");
const REWARD_PENDING_MESSAGE = i18n.t("hook.adRewardPending", {
  count: DAILY_LIMIT,
});
const NOT_READY_MESSAGE = i18n.t("hook.adLoading");

type RewardOutcome = "rewarded" | "pending" | "unknown";

function delay(millis: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error("aborted"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, millis);

    signal.addEventListener("abort", onAbort, { once: true });
  });
}

// 잔액이 늘 때까지 몇 번 다시 읽는다. 이전 잔액을 모르면 늘었는지 알 수 없어 unknown이다.
export async function waitForReward(
  before: number | null,
  fetchBalance: () => Promise<number>,
  signal: AbortSignal,
  interval = REWARD_POLL_INTERVAL,
  attempts = REWARD_POLL_COUNT,
): Promise<RewardOutcome> {
  if (before === null) {
    return "unknown";
  }

  for (let attempt = 1; attempt <= attempts; attempt++) {
    await delay(interval, signal);

    const balance = await fetchBalance().catch(() => null);

    if (balance !== null && before !== null && balance > before) {
      return "rewarded";
    }
  }

  return "pending";
}

export function useAdReward() {
  const queryClient = useQueryClient();
  const { data } = useMyProfile();
  const memberId = data?.memberId;

  const {
    isLoaded,
    isClosed,
    isEarnedReward,
    load,
    show: showAd,
  } = useRewardedAd(memberId === undefined ? null : REWARDED_AD_UNIT_ID, {
    serverSideVerificationOptions: { userId: String(memberId) },
  });

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isClosed) {
      load();
    }
  }, [isClosed, load]);

  const balanceBefore = useRef<number | null>(null);

  useEffect(() => {
    if (!isEarnedReward) {
      return;
    }

    const controller = new AbortController();

    waitForReward(balanceBefore.current, api.points.balance, controller.signal)
      .then((outcome) => {
        queryClient.invalidateQueries({ queryKey: POINT_BALANCE_KEY });
        queryClient.invalidateQueries({ queryKey: POINT_HISTORIES_KEY });
        showToast(
          outcome === "pending" ? "warning" : "info",
          outcome === "pending" ? REWARD_PENDING_MESSAGE : REWARD_MESSAGE,
        );
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [isEarnedReward, queryClient]);

  return {
    ready: isLoaded,
    watch: async () => {
      if (!isLoaded) {
        showToast("warning", NOT_READY_MESSAGE);
        return;
      }

      balanceBefore.current = await queryClient
        .ensureQueryData({
          queryKey: POINT_BALANCE_KEY,
          queryFn: api.points.balance,
        })
        .catch(() => null);
      showAd();
    },
  };
}
