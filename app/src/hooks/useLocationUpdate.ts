import { useMutation } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useCallback, useState } from "react";

import { alertApiError, alertMessage } from "@/lib/alert";
import { api } from "@/lib/api";

const DENIED_MESSAGE = "위치 권한을 허용해야 거리순으로 볼 수 있습니다.";

export function useLocationUpdate() {
  const [updating, setUpdating] = useState(false);
  const heartbeat = useMutation({ mutationFn: api.members.heartbeat });

  const send = useCallback(async () => {
    const { coords } = await Location.getCurrentPositionAsync({});

    await heartbeat.mutateAsync({
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
        alertMessage(DENIED_MESSAGE);
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
        await heartbeat.mutateAsync({});
        return;
      }

      await send();
    } catch (error) {
      alertApiError(error);
    }
  }, [heartbeat, send]);

  return { updating, update, refresh };
}
