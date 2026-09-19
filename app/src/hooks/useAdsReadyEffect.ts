import { useEffect } from "react";

import { whenAdsReady } from "@/lib/ads";

export function useAdsReadyEffect(effect: () => void) {
  useEffect(() => {
    let active = true;

    whenAdsReady().then(() => {
      if (active) {
        effect();
      }
    });

    return () => {
      active = false;
    };
  }, [effect]);
}
