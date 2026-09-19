import { useFocusEffect } from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { AppState, type ViewToken } from "react-native";
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

const VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 1,
  minimumViewTime: 0,
};

type ListAdOptions = {
  unitId?: string;
  aspectRatio?: NativeMediaAspectRatio;
  interval?: number;
  imageOnly?: boolean;
};

type LoadedAd = { ad: NativeAd; loadedAt: number };

type SlotAds = readonly (NativeAd | undefined)[];

function createAdPool({
  unitId = NATIVE_AD_UNIT_ID,
  aspectRatio,
  imageOnly = false,
}: ListAdOptions) {
  let loaded: LoadedAd[] = [];
  let ads: NativeAd[] = [];
  let displayed: SlotAds = [];
  let owned = new Set<NativeAd>();
  let wanted = 0;
  let loading = false;
  let generation = 0;
  let failedAt = 0;
  let renewBefore = -Infinity;
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((listener) => listener());

  // 바꿔 받은 광고라도 화면에 남아 있는 동안은 해제하지 않는다.
  function sweep() {
    const kept = new Set<NativeAd>(ads);
    displayed.forEach((ad) => ad && kept.add(ad));
    owned.forEach((ad) => {
      if (!kept.has(ad)) {
        ad.destroy();
      }
    });
    owned = kept;
  }

  const staleIndex = () =>
    loaded.findIndex(
      (entry, index) => index < wanted && entry.loadedAt <= renewBefore,
    );

  // 새 광고는 오래된 광고 자리에 바꿔 끼운다. 비우고 다시 채우면 광고 칸이 접혔다 생기며 목록이 움직인다.
  function place(ad: NativeAd) {
    const entry = { ad, loadedAt: Date.now() };
    const stale = staleIndex();

    loaded =
      stale < 0
        ? [...loaded, entry]
        : loaded.map((current, index) => (index === stale ? entry : current));
    ads = loaded.map((current) => current.ad);
    sweep();
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
    owned.forEach((ad) => ad.destroy());
    owned = new Set();
    displayed = [];

    if (loaded.length > 0) {
      loaded = [];
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
      renewOlderThan(AD_EXPIRE_AFTER);
      loadNext();
    },
    display(next: SlotAds) {
      displayed = next;
      sweep();
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

// 광고 칸은 앞 항목 아래에 붙으므로, 그 뒤로 보이는 항목이 있으면 새 광고를 끼우지 않고 이전 것을 둔다.
// 끼우면 아래 항목이 밀린다. 칸이 화면 아래로 벗어나거나 화면에 다시 들어올 때 끼운다.
function slotAds(
  shown: SlotAds,
  loaded: readonly NativeAd[],
  lastVisibleIndex: number,
  interval: number,
): SlotAds {
  const next = loaded.map((ad, slot) =>
    (slot + 1) * interval - 1 >= lastVisibleIndex ? ad : shown[slot],
  );

  return next.length === shown.length &&
    next.every((ad, index) => ad === shown[index])
    ? shown
    : next;
}

export function useListNativeAds(
  options: ListAdOptions,
  itemCount: number,
  listKey: string,
) {
  const interval = options.interval ?? LIST_AD_INTERVAL;
  const [pool] = useState(() => createAdPool(options));
  const loaded = useSyncExternalStore(pool.subscribe, pool.getAds);
  const [ads, setAds] = useState<SlotAds>([]);
  const lastVisibleIndex = useRef(-1);
  const wanted = Math.floor(itemCount / interval);

  useEffect(() => () => pool.destroy(), [pool]);

  useEffect(() => {
    pool.reset();
  }, [pool, listKey]);

  useEffect(() => {
    pool.want(wanted);
  }, [pool, wanted]);

  useEffect(() => {
    setAds((shown) =>
      slotAds(shown, loaded, lastVisibleIndex.current, interval),
    );
  }, [interval, loaded]);

  useEffect(() => {
    pool.display(ads);
  }, [pool, ads]);

  useFocusEffect(
    useCallback(() => {
      const enter = () => {
        setAds(pool.getAds());
        pool.renewOlderThan(AD_EXPIRE_AFTER);
      };

      enter();

      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") {
          enter();
        }
      });

      return () => subscription.remove();
    }, [pool]),
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      lastVisibleIndex.current = viewableItems.reduce(
        (last, item) => Math.max(last, item.index ?? -1),
        -1,
      );
      setAds((shown) =>
        slotAds(shown, pool.getAds(), lastVisibleIndex.current, interval),
      );
    },
    [interval, pool],
  );

  const viewability = useMemo(
    () => ({ onViewableItemsChanged, viewabilityConfig: VIEWABILITY_CONFIG }),
    [onViewableItemsChanged],
  );

  const renew = useCallback(() => pool.renewOlderThan(AD_RENEW_AFTER), [pool]);

  return { ads, renew, viewability };
}
