import { YStack, type YStackProps } from "tamagui";

import { RETRO_SHADOW_OFFSET } from "@/lib/design";

/**
 * 색은 위계 신호다. 떠 있거나 누르는 것은 `$gray12`, 구조물은 `$gray8`.
 * 오프셋은 기본값과 소형 버튼용 `RETRO_SHADOW_OFFSET_SM`만 쓴다.
 */
export function RetroShadow({
  color,
  offset = RETRO_SHADOW_OFFSET,
}: {
  color: YStackProps["bg"];
  offset?: number;
}) {
  return (
    <YStack
      position="absolute"
      t={offset}
      b={-offset}
      l={offset}
      r={-offset}
      bg={color}
    />
  );
}
