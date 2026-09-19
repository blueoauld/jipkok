import { useEffect, useState, useSyncExternalStore } from "react";
import {
  NativeAd,
  type NativeMediaAspectRatio,
} from "react-native-google-mobile-ads";

import { LIST_AD_INTERVAL, NATIVE_AD_UNIT_ID } from "@/lib/ads";

function createAdPool(aspectRatio: NativeMediaAspectRatio) {
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

    NativeAd.createForAdRequest(NATIVE_AD_UNIT_ID, { aspectRatio })
      .then((ad) => {
        if (started !== generation) {
          ad.destroy();
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
  aspectRatio: NativeMediaAspectRatio,
  itemCount: number,
  listKey: string,
) {
  const [pool] = useState(() => createAdPool(aspectRatio));
  const ads = useSyncExternalStore(pool.subscribe, pool.getAds);
  const wanted = Math.floor(itemCount / LIST_AD_INTERVAL);

  useEffect(() => () => pool.destroy(), [pool]);

  useEffect(() => {
    pool.reset();
  }, [pool, listKey]);

  useEffect(() => {
    pool.want(wanted);
  }, [pool, wanted]);

  return ads;
}
