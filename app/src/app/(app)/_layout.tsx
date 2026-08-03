import { router, Stack } from "expo-router";
import { useEffect } from "react";

import { useMyProfile } from "@/hooks/useMyProfile";
import { findServiceSuspension } from "@/lib/suspension";

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
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
