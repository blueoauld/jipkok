import { Stack } from "expo-router";

import { STACK_SCREEN_OPTIONS } from "@/lib/router";

// iOS 시스템 탭 바에는 헤더가 없어서 탭마다 스택을 두고 그 헤더를 쓴다. 안드로이드 탭도 같은 구조다.
export function TabStack() {
  return <Stack screenOptions={STACK_SCREEN_OPTIONS} />;
}
