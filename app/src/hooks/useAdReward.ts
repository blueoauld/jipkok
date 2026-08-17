import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useRewardedAd } from "react-native-google-mobile-ads";

import { useMyProfile } from "@/hooks/useMyProfile";
import { POINT_BALANCE_KEY, POINT_HISTORIES_KEY } from "@/hooks/usePoints";
import { REWARDED_AD_UNIT_ID } from "@/lib/ads";
import { api } from "@/lib/api";
import { showToast } from "@/lib/toast/store";

// 보상은 광고 서버가 우리 서버로 콜백을 보내야 들어오므로 시청 직후엔 아직 없을 수 있다.
const REWARD_POLL_INTERVAL = 2000;
const REWARD_POLL_COUNT = 6;
const DAILY_LIMIT = 5;

const REWARD_MESSAGE = "광고 보상을 받았습니다.";
const REWARD_PENDING_MESSAGE = `보상이 아직 반영되지 않았습니다. 광고 보상은 하루 ${DAILY_LIMIT}번까지 받을 수 있습니다.`;
const NOT_READY_MESSAGE =
  "광고를 준비하고 있습니다. 잠시 후 다시 시도해주시길 바랍니다.";

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

    let cancelled = false;
    const before = balanceBefore.current;

    const finish = (rewarded: boolean) => {
      queryClient.invalidateQueries({ queryKey: POINT_BALANCE_KEY });
      queryClient.invalidateQueries({ queryKey: POINT_HISTORIES_KEY });
      showToast(
        rewarded ? "info" : "warning",
        rewarded ? REWARD_MESSAGE : REWARD_PENDING_MESSAGE,
      );
    };

    const poll = async (attempt: number) => {
      const balance = await api.points.balance().catch(() => null);

      if (cancelled) {
        return;
      }

      if (balance !== null && before !== null && balance > before) {
        finish(true);
      } else if (attempt >= REWARD_POLL_COUNT) {
        finish(before === null);
      } else {
        setTimeout(() => poll(attempt + 1), REWARD_POLL_INTERVAL);
      }
    };

    const timer = setTimeout(() => poll(1), REWARD_POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isEarnedReward, queryClient]);

  return {
    ready: isLoaded,
    watch: () => {
      if (!isLoaded) {
        showToast("warning", NOT_READY_MESSAGE);
        return;
      }

      balanceBefore.current =
        queryClient.getQueryData<number>(POINT_BALANCE_KEY) ?? null;
      showAd();
    },
  };
}
