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

// 화면 아래에 붙는 것과 화면 끝 사이에 둘 거리다. 안드로이드 시스템 바는 불투명한 띠라 그 위에 딱 붙으면
// 바에 얹힌 것처럼 보이므로 바 높이에 여백을 더한다. iOS 홈 인디케이터는 앱 배경 위에 떠 있는 선이라
// TDS처럼 안전영역과 여백 중 큰 값을 쓴다.
export function bottomSpacing(bottomInset: number, padding: number) {
  return Platform.OS === "android"
    ? bottomInset + padding
    : Math.max(bottomInset, padding);
}

// SafeAreaView가 이미 안전영역만큼 띄워 둔 화면에서, 그 위에 더 둘 여백이다. 키보드 위로 올라가는 줄이
// 이 값을 쓰면 시스템 바가 가려지는 만큼 KeyboardStickyView의 opened 값에 더해 도로 내려야 한다.
export function useExtraBottomSpacing(padding: number) {
  const insets = useSafeAreaInsets();

  return bottomSpacing(insets.bottom, padding) - insets.bottom;
}

// 탭 화면에서 탭 바가 내용을 덮는 높이다. iOS 시스템 탭은 탭마다 안전영역을 따로 재서 아래 값에 탭 바가
// 들어 있고, 안드로이드 탭 바는 흐름 안에 있어 0이다. 탭 화면 안에서만 부를 것.
export function useTabBarOverlay() {
  const insets = useSafeAreaInsets();

  return Platform.OS === "ios" ? insets.bottom : 0;
}
