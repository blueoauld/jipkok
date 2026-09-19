import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { AppState } from "react-native";
import {
  NativeAd,
  type NativeMediaAspectRatio,
} from "react-native-google-mobile-ads";

import {
  AD_EXPIRE_AFTER,
  AD_RENEW_AFTER,
  LIST_AD_INTERVAL,
  NATIVE_AD_UNIT_ID,
  whenAdsReady,
} from "@/lib/ads";

type ListAdOptions = {
  unitId?: string;
  aspectRatio?: NativeMediaAspectRatio;
  interval?: number;
  imageOnly?: boolean;
};

type LoadedAd = { ad: NativeAd; loadedAt: number };

function createAdPool({
  unitId = NATIVE_AD_UNIT_ID,
  aspectRatio,
  imageOnly = false,
}: ListAdOptions) {
  let loaded: LoadedAd[] = [];
  let ads: NativeAd[] = [];
  let wanted = 0;
  let loading = false;
  let generation = 0;
  let failedAt = 0;
  let renewBefore = -Infinity;
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((listener) => listener());

  function publish(next: LoadedAd[]) {
    loaded = next;
    ads = next.map((entry) => entry.ad);
  }

  const staleIndex = () =>
    loaded.findIndex(
      (entry, index) => index < wanted && entry.loadedAt <= renewBefore,
    );

  // 새 광고는 오래된 광고 자리에 바꿔 끼운다. 비우고 다시 채우면 광고 칸이 접혔다 생기며 목록이 움직인다.
  function place(ad: NativeAd) {
    const entry = { ad, loadedAt: Date.now() };
    const stale = staleIndex();

    if (stale < 0) {
      publish([...loaded, entry]);
    } else {
      loaded[stale].ad.destroy();
      publish(
        loaded.map((current, index) => (index === stale ? entry : current)),
      );
    }

    notify();
  }

  function fail() {
    if (staleIndex() >= 0) {
      renewBefore = -Infinity;
    } else {
      failedAt = wanted;
    }
  }

  function loadNext() {
    const renewing = staleIndex() >= 0;

    if (
      loading ||
      (!renewing && (loaded.length >= wanted || wanted <= failedAt))
    ) {
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
          fail();
          return;
        }

        place(ad);
      })
      .catch(() => {
        if (started === generation) {
          fail();
        }
      })
      .finally(() => {
        if (started === generation) {
          loading = false;
          loadNext();
        }
      });
  }

  function renewOlderThan(age: number) {
    const threshold = Date.now() - age;

    if (
      loaded.some(
        (entry, index) => index < wanted && entry.loadedAt <= threshold,
      )
    ) {
      renewBefore = threshold;
      loadNext();
    }
  }

  function clear() {
    generation += 1;
    loading = false;
    failedAt = 0;
    renewBefore = -Infinity;

    if (loaded.length > 0) {
      loaded.forEach((entry) => entry.ad.destroy());
      publish([]);
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
      renewOlderThan(AD_EXPIRE_AFTER);
      loadNext();
    },
    renewOlderThan,
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

  useFocusEffect(
    useCallback(() => {
      pool.renewOlderThan(AD_EXPIRE_AFTER);

      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") {
          pool.renewOlderThan(AD_EXPIRE_AFTER);
        }
      });

      return () => subscription.remove();
    }, [pool]),
  );

  const renew = useCallback(() => pool.renewOlderThan(AD_RENEW_AFTER), [pool]);

  return { ads, renew };
}
