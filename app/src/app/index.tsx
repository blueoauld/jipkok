import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, YStack } from "tamagui";

import { ErrorState } from "@/components/ui/ErrorState";
import { restoreSession } from "@/lib/api";
import { useAuthStore } from "@/lib/auth/store";

export default function IndexScreen() {
  const status = useAuthStore((state) => state.status);
  const [failed, setFailed] = useState(false);

  const restore = useCallback(() => {
    restoreSession().catch(() => setFailed(true));
  }, []);

  const retry = () => {
    setFailed(false);
    restore();
  };

  useEffect(() => {
    restore();
  }, [restore]);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/main");
    }
  }, [status]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack flex={1} justify="center" items="center" gap="$4" p="$4">
        {failed ? (
          <ErrorState message="연결에 실패했습니다." onRetry={retry} />
        ) : (
          <Spinner size="small" />
        )}
      </YStack>
    </SafeAreaView>
  );
}
