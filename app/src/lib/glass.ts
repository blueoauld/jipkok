import {
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";

import { OVERLAY_INK } from "@/lib/design";
import { useThemeStore } from "@/lib/theme/store";

// 일부 iOS 26 베타에는 API가 빠져 있어 두 검사를 모두 통과해야 크래시를 피한다.
export const GLASS_ENABLED =
  isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

// 사진 위 유리는 앱 스킴을 따르되 틴트를 옅게 깔아 글자가 늘 읽히게 한다. 유리는 안쪽
// 글자 색을 바꿔 주지 않으므로 라이트는 밝은 유리에 검정, 다크는 어두운 유리에 흰색이다.
const PHOTO_GLASS = {
  light: { tint: "rgba(255, 255, 255, 0.5)", ink: "black" },
  dark: { tint: "rgba(0, 0, 0, 0.35)", ink: OVERLAY_INK },
} as const;

export function usePhotoGlass() {
  return PHOTO_GLASS[useThemeStore((state) => state.mode)];
}
