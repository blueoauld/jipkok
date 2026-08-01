import { router } from "expo-router";
import { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, YStack } from "tamagui";

import { restoreSession } from "@/lib/api";
import { useAuthStore } from "@/lib/auth/store";

export default function IndexScreen() {
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/main");
    }
  }, [status]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack flex={1} justify="center" items="center" bg="$background">
        <Spinner size="small" />
      </YStack>
    </SafeAreaView>
  );
}
