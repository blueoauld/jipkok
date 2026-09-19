import { useEffect, useState, useSyncExternalStore } from "react";
import {
  NativeAd,
  type NativeMediaAspectRatio,
} from "react-native-google-mobile-ads";

import { LIST_AD_INTERVAL, NATIVE_AD_UNIT_ID, whenAdsReady } from "@/lib/ads";

type ListAdOptions = {
  unitId?: string;
  aspectRatio?: NativeMediaAspectRatio;
  interval?: number;
  imageOnly?: boolean;
};

function createAdPool({
  unitId = NATIVE_AD_UNIT_ID,
  aspectRatio,
  imageOnly = false,
}: ListAdOptions) {
  let ads: NativeAd[] = [];
  let wanted = 0;
  let loading = false;
  let generation = 0;
  let failedAt = 0;
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((listener) => listener());

  function loadNext() {
    if (loading || ads.length >= wanted || wanted <= failedAt) {
      return;
    }

    loading = true;
    const started = generation;

    whenAdsReady()
      .then(() =>
        started === generation
          ? NativeAd.createForAdRequest(unitId, { aspectRatio })
          : null,
      )
      .then((ad) => {
        if (ad === null || started !== generation) {
          ad?.destroy();
          return;
        }

        if (imageOnly && ad.mediaContent?.hasVideoContent) {
          ad.destroy();
          failedAt = wanted;
          return;
        }

        ads = [...ads, ad];
        notify();
      })
      .catch(() => {
        if (started === generation) {
          failedAt = wanted;
        }
      })
      .finally(() => {
        if (started === generation) {
          loading = false;
          loadNext();
        }
      });
  }

  function clear() {
    generation += 1;
    loading = false;
    failedAt = 0;

    if (ads.length > 0) {
      ads.forEach((ad) => ad.destroy());
      ads = [];
    }
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);

      return () => listeners.delete(listener);
    },
    getAds: () => ads,
    want(count: number) {
      wanted = count;
      loadNext();
    },
    reset() {
      clear();
      notify();
      loadNext();
    },
    destroy: clear,
  };
}

export function useListNativeAds(
  options: ListAdOptions,
  itemCount: number,
  listKey: string,
) {
  const [pool] = useState(() => createAdPool(options));
  const ads = useSyncExternalStore(pool.subscribe, pool.getAds);
  const wanted = Math.floor(itemCount / (options.interval ?? LIST_AD_INTERVAL));

  useEffect(() => () => pool.destroy(), [pool]);

  useEffect(() => {
    pool.reset();
  }, [pool, listKey]);

  useEffect(() => {
    pool.want(wanted);
  }, [pool, wanted]);

  return ads;
}
