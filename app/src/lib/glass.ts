import {
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import { createContext } from "react";

import { colorScheme, useThemeStore } from "@/lib/theme/store";

// 일부 iOS 26 베타에는 API가 빠져 있어 두 검사를 모두 통과해야 크래시를 피한다.
export const GLASS_ENABLED =
  isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

export const GlassGroupContext = createContext(false);

// 앱이 자체 테마 토글을 갖고 있어 유리가 시스템 외관을 따르면 화면과 어긋난다.
export function useGlassColorScheme() {
  return colorScheme(useThemeStore((state) => state.mode));
}
