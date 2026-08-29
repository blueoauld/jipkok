import {
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import { createContext } from "react";

// 일부 iOS 26 베타에는 API가 빠져 있어 두 검사를 모두 통과해야 크래시를 피한다.
export const GLASS_ENABLED =
  isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

export const GlassGroupContext = createContext(false);
