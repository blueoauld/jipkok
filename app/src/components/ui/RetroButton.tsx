import { Button, type ButtonProps, YStack, type YStackProps } from "tamagui";

import { RetroShadow } from "@/components/ui/RetroShadow";
import { RETRO_BORDER_WIDTH, RETRO_SHADOW_OFFSET } from "@/lib/design";
import { useAccent } from "@/lib/theme/accent";

export function RetroButton({
  theme,
  flex,
  disabled,
  shadow = "$gray12",
  ...buttonProps
}: ButtonProps & { shadow?: YStackProps["bg"] }) {
  const accent = useAccent();

  return (
    <YStack theme={disabled ? "gray" : (theme ?? accent)} flex={flex}>
      <RetroShadow color={shadow} />
      <Button
        size="$4"
        bg={disabled ? "$color8" : "$color10"}
        borderWidth={RETRO_BORDER_WIDTH}
        borderColor="$gray12"
        rounded={0}
        color="white"
        fontWeight="700"
        pressStyle={{
          x: RETRO_SHADOW_OFFSET,
          y: RETRO_SHADOW_OFFSET,
          bg: "$color11",
          borderColor: "$gray12",
        }}
        disabled={disabled}
        {...buttonProps}
        // 안드로이드는 aria-disabled가 빠지면 setEnabled(true)로 되돌리지 않는다.
        // 그러면 한 번 disabled였던 뷰가 계속 터치 대상에서 빠져 라벨만 눌리므로,
        // false일 때도 값을 실어 보내 복구시킨다.
        aria-disabled={Boolean(disabled)}
      />
    </YStack>
  );
}
