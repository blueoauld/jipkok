import {
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import { createContext } from "react";

// 일부 iOS 26 베타에는 API가 빠져 있어 두 검사를 모두 통과해야 크래시를 피한다.
export const GLASS_ENABLED =
  isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

export const GlassGroupContext = createContext(false);

// 사진 위 유리는 앱 테마와 무관하게 늘 밝은 유리다. 사진이 밝든 어둡든 같은 모습이라야
// 카드마다 버튼이 달라 보이지 않는다. 그래서 글자와 아이콘도 검정으로 고정한다.
export const PHOTO_GLASS_PROPS = {
  colorScheme: "light",
  tintColor: "rgba(255, 255, 255, 0.5)",
} as const;

export const PHOTO_GLASS_INK = "black";
