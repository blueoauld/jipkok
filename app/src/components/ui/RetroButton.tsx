import { Button, type ButtonProps, YStack } from "tamagui";

import { RetroShadow } from "@/components/ui/RetroShadow";
import { RETRO_SHADOW_OFFSET } from "@/lib/design";

export function RetroButton({
  theme = "blue",
  opacity,
  flex,
  ...buttonProps
}: ButtonProps) {
  return (
    <YStack theme={theme} opacity={opacity} flex={flex}>
      <RetroShadow color="$gray12" />
      <Button
        size="$4"
        bg="$color10"
        borderWidth={2}
        borderColor="$color12"
        rounded={0}
        color="white"
        fontWeight="700"
        pressStyle={{
          x: RETRO_SHADOW_OFFSET,
          y: RETRO_SHADOW_OFFSET,
          bg: "$color11",
          borderColor: "$color12",
        }}
        {...buttonProps}
        // 안드로이드는 aria-disabled가 빠지면 setEnabled(true)로 되돌리지 않는다.
        // 그러면 한 번 disabled였던 뷰가 계속 터치 대상에서 빠져 라벨만 눌리므로,
        // false일 때도 값을 실어 보내 복구시킨다.
        aria-disabled={Boolean(buttonProps.disabled)}
      />
    </YStack>
  );
}
