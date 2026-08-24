import { router, Stack } from "expo-router";
import { useEffect } from "react";

import { useMyProfile } from "@/hooks/useMyProfile";
import { findServiceSuspension } from "@/lib/suspension";

// 화면 오류를 여기서 먼저 잡아야 루트가 살아남아 쿼리 캐시가 유지된다.
export { AppErrorBoundary as ErrorBoundary } from "@/components/AppErrorBoundary";

function useServiceSuspensionGuard() {
  const { data: profile } = useMyProfile();
  const suspended = findServiceSuspension(profile) !== undefined;

  useEffect(() => {
    if (suspended) {
      router.replace("/suspended");
    }
  }, [suspended]);
}

export default function AppLayout() {
  useServiceSuspensionGuard();

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
