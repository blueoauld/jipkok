import { Button, type ButtonProps, YStack, type YStackProps } from "tamagui";

import { RetroShadow } from "@/components/ui/RetroShadow";
import { RETRO_BORDER_WIDTH, RETRO_SHADOW_OFFSET } from "@/lib/design";
import { useAccent } from "@/lib/theme/accent";

// flat은 그림자 없이 눌러도 가라앉지 않는다. 알럿처럼 이미 떠 있는 상자 안의 버튼에 쓴다.
export function RetroButton({
  theme,
  flex,
  disabled,
  shadow = "$gray12",
  flat = false,
  ...buttonProps
}: ButtonProps & { shadow?: YStackProps["bg"]; flat?: boolean }) {
  const accent = useAccent();
  // 회색 버튼은 중간 회색 위 흰 글씨라 대비가 4:1에 못 미친다. 옅은 표면에 잉크색으로 간다.
  const muted = theme === "gray" && !disabled;

  return (
    <YStack theme={disabled ? "gray" : (theme ?? accent)} flex={flex}>
      {!flat && <RetroShadow color={shadow} />}
      <Button
        size="$4"
        bg={disabled ? "$color8" : muted ? "$color3" : "$color10"}
        borderWidth={RETRO_BORDER_WIDTH}
        borderColor="$gray12"
        rounded={0}
        color={muted ? "$color12" : "white"}
        fontWeight="700"
        pressStyle={{
          x: flat ? 0 : RETRO_SHADOW_OFFSET,
          y: flat ? 0 : RETRO_SHADOW_OFFSET,
          bg: muted ? "$color5" : "$color11",
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
