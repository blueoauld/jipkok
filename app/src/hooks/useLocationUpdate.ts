import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useCallback, useState } from "react";

import { POINT_BALANCE_KEY, POINT_HISTORIES_KEY } from "@/hooks/usePoints";
import { alertApiError, alertInfo } from "@/lib/alert";
import { api } from "@/lib/api";

const DENIED_MESSAGE = "위치 권한을 허용해야 거리순으로 볼 수 있습니다.";

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

  const send = useCallback(async () => {
    const { coords } = await Location.getCurrentPositionAsync({});

    await heartbeat({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
  }, [heartbeat]);

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

      await send();

      return true;
    } catch (error) {
      alertApiError(error);
      return false;
    } finally {
      setUpdating(false);
    }
  }, [send, updating]);

  const refresh = useCallback(async () => {
    try {
      const permission = await Location.getForegroundPermissionsAsync();

      if (!permission.granted) {
        await heartbeat({});
        return;
      }

      await send();
    } catch (error) {
      alertApiError(error);
    }
  }, [heartbeat, send]);

  return { updating, update, refresh };
}
