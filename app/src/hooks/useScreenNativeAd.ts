import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { NativeAd } from "react-native-google-mobile-ads";

const REFRESH_AFTER = 60_000;

type LoadedAd = { ad: NativeAd; loadedAt: number };

export function useScreenNativeAd(unitId: string, enabled: boolean) {
  const [loaded, setLoaded] = useState<LoadedAd | null>(null);
  const loading = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => () => loaded?.ad.destroy(), [loaded]);

  const load = useCallback(() => {
    if (loading.current) {
      return;
    }

    loading.current = true;

    NativeAd.createForAdRequest(unitId)
      .then((ad) => {
        if (!mounted.current || ad.mediaContent?.hasVideoContent) {
          ad.destroy();
          return;
        }

        setLoaded({ ad, loadedAt: Date.now() });
      })
      .catch(() => undefined)
      .finally(() => {
        loading.current = false;
      });
  }, [unitId]);

  useFocusEffect(
    useCallback(() => {
      if (
        enabled &&
        (loaded === null || Date.now() - loaded.loadedAt >= REFRESH_AFTER)
      ) {
        load();
      }
    }, [enabled, load, loaded]),
  );

  return enabled ? (loaded?.ad ?? null) : null;
}
