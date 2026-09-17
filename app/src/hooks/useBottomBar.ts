import { useSafeAreaInsets } from "react-native-safe-area-context";

import { bottomBarHeight, floatingBarHeight } from "@/lib/design";
import { GLASS_ENABLED } from "@/lib/glass";

// 아래 바가 차지하는 높이. 화면 바닥에 붙는 것들이 그만큼 올라오는 데 쓴다.
export function useBottomBarHeight() {
  const insets = useSafeAreaInsets();

  return GLASS_ENABLED
    ? floatingBarHeight(insets.bottom)
    : bottomBarHeight(insets.bottom);
}

// 탭 바가 내용을 덮는 높이. 떠 있는 유리 바만 덮고 바닥에 붙은 바는 흐름 안에 있어 0이다.
export function useTabBarOverlay() {
  const height = useBottomBarHeight();

  return GLASS_ENABLED ? height : 0;
}
