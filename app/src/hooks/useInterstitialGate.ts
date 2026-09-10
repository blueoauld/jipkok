import type { Href } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { useInterstitialAd } from "react-native-google-mobile-ads";

import { useAdReload } from "@/hooks/useAdReload";
import { INTERSTITIAL_AD_UNIT_ID } from "@/lib/ads";
import { pushOnce } from "@/lib/router";

export function useInterstitialGate() {
  const { isLoaded, isClosed, error, load, show } = useInterstitialAd(
    INTERSTITIAL_AD_UNIT_ID,
  );
  const pendingAction = useRef<(() => void) | null>(null);
  const { reload } = useAdReload(error, load);

  const enter = useCallback(() => {
    const action = pendingAction.current;
    pendingAction.current = null;

    action?.();
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (isClosed) {
      enter();
      reload();
    }
  }, [isClosed, enter, reload]);

  useEffect(() => {
    if (error) {
      enter();
    }
  }, [error, enter]);

  // 광고가 준비되지 않았거나 실패하면 기다리지 않고 바로 실행한다.
  const run = useCallback(
    (action: () => void) => {
      if (!isLoaded) {
        action();
        return;
      }

      pendingAction.current = action;
      show();
    },
    [isLoaded, show],
  );

  const open = useCallback((href: Href) => run(() => pushOnce(href)), [run]);

  return { open, run };
}
