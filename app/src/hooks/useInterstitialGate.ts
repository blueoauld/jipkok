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
  const pendingHref = useRef<Href | null>(null);
  const { reload } = useAdReload(error, load);

  const enter = useCallback(() => {
    const href = pendingHref.current;
    pendingHref.current = null;

    if (href) {
      pushOnce(href);
    }
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

  const open = useCallback(
    (href: Href) => {
      if (!isLoaded) {
        pushOnce(href);
        return;
      }

      pendingHref.current = href;
      show();
    },
    [isLoaded, show],
  );

  return { open };
}
