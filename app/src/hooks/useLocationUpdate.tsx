import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useCallback, useRef } from "react";
import { Platform } from "react-native";

import { POINT_BALANCE_KEY, POINT_HISTORIES_KEY } from "@/hooks/usePoints";
import type { RetroAlertApi } from "@/hooks/useRetroAlert";
import { api } from "@/lib/api";
import i18n from "@/lib/i18n";

const DENIED_MESSAGE = i18n.t("hook.locationDenied");
const SERVICES_OFF_MESSAGE = i18n.t("hook.locationOff");
const FAILED_MESSAGE = i18n.t("hook.locationFailed");

const LOCATION_TIMEOUT = 10_000;

async function resolveCoords() {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const current = await Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), LOCATION_TIMEOUT);
    }),
  ])
    .catch(() => null)
    .finally(() => {
      if (timer) {
        clearTimeout(timer);
      }
    });

  if (current) {
    return current.coords;
  }

  const last = await Location.getLastKnownPositionAsync();

  return last?.coords ?? null;
}

async function resolveCachedCoords() {
  const last = await Location.getLastKnownPositionAsync().catch(() => null);

  return last?.coords ?? (await resolveCoords());
}

export function useLocationUpdate({ show, showApiError }: RetroAlertApi) {
  const queryClient = useQueryClient();
  const updating = useRef(false);
  const refreshing = useRef(false);
  const { mutateAsync: heartbeat } = useMutation({
    mutationFn: api.members.heartbeat,
    onSuccess: async (reward) => {
      if (!reward.earned) {
        return;
      }

      queryClient.setQueryData(POINT_BALANCE_KEY, reward.balance);
      await queryClient.invalidateQueries({ queryKey: POINT_HISTORIES_KEY });
    },
  });

  const enableServices = useCallback(async () => {
    if (await Location.hasServicesEnabledAsync()) {
      return true;
    }

    if (Platform.OS !== "android") {
      return false;
    }

    return Location.enableNetworkProviderAsync().then(
      () => true,
      () => false,
    );
  }, []);

  const update = useCallback(async () => {
    if (updating.current) {
      return false;
    }

    updating.current = true;

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        show("info", DENIED_MESSAGE);
        return false;
      }

      if (!(await enableServices())) {
        show("info", SERVICES_OFF_MESSAGE);
        return false;
      }

      const coords = await resolveCoords();

      if (!coords) {
        show("info", FAILED_MESSAGE);
        return false;
      }

      await heartbeat({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      return true;
    } catch (error) {
      showApiError(error);
      return false;
    } finally {
      updating.current = false;
    }
  }, [enableServices, heartbeat, show, showApiError]);

  const refresh = useCallback(async () => {
    if (refreshing.current) {
      return;
    }

    refreshing.current = true;

    try {
      const permission = await Location.getForegroundPermissionsAsync();

      if (!permission.granted || !(await Location.hasServicesEnabledAsync())) {
        await heartbeat({});
        return;
      }

      const coords = await resolveCachedCoords();

      await heartbeat(
        coords
          ? { latitude: coords.latitude, longitude: coords.longitude }
          : {},
      );
    } catch {
      return;
    } finally {
      refreshing.current = false;
    }
  }, [heartbeat]);

  return { update, refresh };
}
