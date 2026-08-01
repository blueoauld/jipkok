import type { Href } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { useInterstitialAd } from "react-native-google-mobile-ads";

import { INTERSTITIAL_AD_UNIT_ID } from "@/lib/ads";
import { pushOnce } from "@/lib/router";

export function useInterstitialGate() {
  const { isLoaded, isClosed, error, load, show } = useInterstitialAd(
    INTERSTITIAL_AD_UNIT_ID,
  );
  const pendingHref = useRef<Href | null>(null);

  const enter = useCallback(() => {
    const href = pendingHref.current;
    pendingHref.current = null;

    if (href) {
      pushOnce(href);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isClosed) {
      enter();
      load();
    }
  }, [isClosed, enter, load]);

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
