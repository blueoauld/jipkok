import { onlineManager } from "@tanstack/react-query";
import { useCallback, useState } from "react";

export function usePullRefresh(refetch: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    // 끊겨 있으면 쿼리가 멈춘 채 기다려 refetch가 영영 끝나지 않고 스피너가 남는다.
    if (!onlineManager.isOnline()) {
      return;
    }

    setRefreshing(true);

    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return { refreshing, onRefresh };
}
