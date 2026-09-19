import { router, Stack } from "expo-router";
import { useEffect } from "react";

import { useMyProfile } from "@/hooks/useMyProfile";
import { prefetchScreenNativeAd } from "@/hooks/useScreenNativeAd";
import { CHAT_NATIVE_AD_UNIT_ID } from "@/lib/ads";
import { STACK_SCREEN_OPTIONS } from "@/lib/router";
import { findServiceSuspension } from "@/lib/suspension";

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

  useEffect(() => {
    prefetchScreenNativeAd(CHAT_NATIVE_AD_UNIT_ID);
  }, []);

  return (
    <Stack screenOptions={STACK_SCREEN_OPTIONS}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
