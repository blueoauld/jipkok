import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useCallback, useState } from "react";
import { Platform } from "react-native";

import { POINT_BALANCE_KEY, POINT_HISTORIES_KEY } from "@/hooks/usePoints";
import { alertApiError, alertInfo } from "@/lib/alert";
import { api } from "@/lib/api";

const DENIED_MESSAGE = "위치 권한을 허용해야 거리순으로 볼 수 있습니다.";
const SERVICES_OFF_MESSAGE =
  "기기의 위치 기능을 켜야 거리순으로 볼 수 있습니다.";
const FAILED_MESSAGE = "위치를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.";

const LOCATION_TIMEOUT = 10_000;

async function resolveCoords() {
  const current = await Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), LOCATION_TIMEOUT);
    }),
  ]).catch(() => null);

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

export function useLocationUpdate() {
  const queryClient = useQueryClient();
  const [updating, setUpdating] = useState(false);
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
    if (updating) {
      return false;
    }

    setUpdating(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        alertInfo(DENIED_MESSAGE);
        return false;
      }

      if (!(await enableServices())) {
        alertInfo(SERVICES_OFF_MESSAGE);
        return false;
      }

      const coords = await resolveCoords();

      if (!coords) {
        alertInfo(FAILED_MESSAGE);
        return false;
      }

      await heartbeat({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      return true;
    } catch (error) {
      alertApiError(error);
      return false;
    } finally {
      setUpdating(false);
    }
  }, [enableServices, heartbeat, updating]);

  const refresh = useCallback(async () => {
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
    } catch (error) {
      alertApiError(error);
    }
  }, [heartbeat]);

  return { updating, update, refresh };
}
