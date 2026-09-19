import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { NativeAd } from "react-native-google-mobile-ads";

import { AD_EXPIRE_AFTER, AD_RENEW_AFTER, whenAdsReady } from "@/lib/ads";

type LoadedAd = { ad: NativeAd; loadedAt: number };

function createAdSlot(unitId: string) {
  let pending: LoadedAd | null = null;
  let loading = false;
  let lastLoadedAt = -Infinity;

  return {
    load() {
      if (loading || pending) {
        return;
      }

      loading = true;

      whenAdsReady()
        .then(() => NativeAd.createForAdRequest(unitId))
        .then((ad) => {
          if (ad.mediaContent?.hasVideoContent) {
            ad.destroy();
            return;
          }

          lastLoadedAt = Date.now();
          pending = { ad, loadedAt: lastLoadedAt };
        })
        .catch(() => undefined)
        .finally(() => {
          loading = false;
        });
    },
    take() {
      const next = pending;
      pending = null;

      return next;
    },
    loadedWithin: (duration: number) => Date.now() - lastLoadedAt < duration,
  };
}

const slots = new Map<string, ReturnType<typeof createAdSlot>>();

function slotFor(unitId: string) {
  let slot = slots.get(unitId);

  if (!slot) {
    slot = createAdSlot(unitId);
    slots.set(unitId, slot);
  }

  return slot;
}

export function prefetchScreenNativeAd(unitId: string) {
  slotFor(unitId).load();
}

// 보는 중에 광고가 끼어들어 목록이 밀리지 않도록, 받아 둔 광고는 화면에 들어올 때만 꺼내 보여 준다.
export function useScreenNativeAd(unitId: string, enabled: boolean) {
  const [shown, setShown] = useState<LoadedAd | null>(null);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => () => shown?.ad.destroy(), [shown]);

  useFocusEffect(
    useCallback(() => {
      const slot = slotFor(unitId);
      const now = Date.now();
      const next = slot.take();

      if (next && now - next.loadedAt < AD_EXPIRE_AFTER) {
        setShown(next);
      } else {
        next?.ad.destroy();
        setShown((current) =>
          current && now - current.loadedAt < AD_EXPIRE_AFTER ? current : null,
        );
      }

      if (enabledRef.current && !slot.loadedWithin(AD_RENEW_AFTER)) {
        slot.load();
      }
    }, [unitId]),
  );

  return enabled ? (shown?.ad ?? null) : null;
}
