import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { bottomBarHeight, FLOATING_BAR_AREA_HEIGHT } from "@/lib/design";
import { GLASS_ENABLED } from "@/lib/glass";

// 아래 바가 차지하는 높이. 화면 바닥에 붙는 것들이 그만큼 올라오는 데 쓴다.
export function useBottomBarHeight() {
  const insets = useSafeAreaInsets();

  return GLASS_ENABLED
    ? FLOATING_BAR_AREA_HEIGHT
    : bottomBarHeight(insets.bottom);
}

// 탭 화면에서 탭 바가 내용을 덮는 높이다. iOS 시스템 탭은 탭마다 안전영역을 따로 재서 아래 값에 탭 바가
// 들어 있고, 안드로이드 탭 바는 흐름 안에 있어 0이다. 탭 화면 안에서만 부를 것.
export function useTabBarOverlay() {
  const insets = useSafeAreaInsets();

  return Platform.OS === "ios" ? insets.bottom : 0;
}
