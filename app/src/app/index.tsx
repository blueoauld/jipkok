import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Spinner, Text, YStack } from "tamagui";

import { restoreSession } from "@/lib/api";
import { useAuthStore } from "@/lib/auth/store";

export default function IndexScreen() {
  const status = useAuthStore((state) => state.status);
  const [failed, setFailed] = useState(false);

  const restore = useCallback(() => {
    setFailed(false);
    restoreSession().catch(() => setFailed(true));
  }, []);

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
          <>
            <Text color="$gray10" fontSize="$4">
              연결에 실패했습니다.
            </Text>

            <Button size="$3" theme="blue" rounded="$7" onPress={restore}>
              다시 시도
            </Button>
          </>
        ) : (
          <Spinner size="small" />
        )}
      </YStack>
    </SafeAreaView>
  );
}
