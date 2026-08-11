import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRewardedAd } from "react-native-google-mobile-ads";

import { useMyProfile } from "@/hooks/useMyProfile";
import { POINT_BALANCE_KEY, POINT_HISTORIES_KEY } from "@/hooks/usePoints";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { REWARDED_AD_UNIT_ID } from "@/lib/ads";

const REWARD_DELAY = 2000;

const REWARD_MESSAGE = "광고 보상이 적립되었습니다.";
const NOT_READY_MESSAGE =
  "광고를 준비하고 있습니다. 잠시 후 다시 시도해주시길 바랍니다.";

export function useAdReward() {
  const queryClient = useQueryClient();
  const { alertElement, show } = useRetroAlert();
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

  useEffect(() => {
    if (!isEarnedReward) {
      return;
    }

    const timer = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: POINT_BALANCE_KEY });
      queryClient.invalidateQueries({ queryKey: POINT_HISTORIES_KEY });
      show("info", REWARD_MESSAGE);
    }, REWARD_DELAY);

    return () => clearTimeout(timer);
  }, [isEarnedReward, queryClient, show]);

  return {
    ready: isLoaded,
    watch: () => (isLoaded ? showAd() : show("info", NOT_READY_MESSAGE)),
    adRewardElement: alertElement,
  };
}
