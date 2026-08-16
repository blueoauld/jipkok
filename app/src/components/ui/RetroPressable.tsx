import { XStack, type XStackProps, YStack } from "tamagui";

import { RetroShadow } from "@/components/ui/RetroShadow";
import { RETRO_BORDER_WIDTH, RETRO_SHADOW_OFFSET } from "@/lib/design";

/**
 * 그림자 오프셋과 눌렸을 때 내려가는 거리는 같아야 한다. 어긋나면 눌러도
 * 그림자가 남거나 넘어간다. 두 값을 한곳에서 쓰려고 묶은 컴포넌트다.
 * 정렬은 쓰는 쪽마다 달라서 넘기지 않는다.
 *
 * 눌린 표시는 배경색이 기본이고, 사진처럼 배경을 덮을 수 없는 것은
 * `pressOpacity`를 쓴다. `flex`는 그림자 기준이 되는 바깥에만 걸린다.
 */
export function RetroPressable({
  theme,
  shadow = "$gray12",
  offset = RETRO_SHADOW_OFFSET,
  pressBg,
  pressOpacity,
  flex,
  onPress,
  children,
  ...props
}: XStackProps & {
  shadow?: XStackProps["bg"];
  offset?: number;
  pressBg?: XStackProps["bg"];
  pressOpacity?: number;
}) {
  return (
    <YStack theme={theme} flex={flex}>
      <RetroShadow color={shadow} offset={offset} />
      <XStack
        borderWidth={RETRO_BORDER_WIDTH}
        borderColor="$gray12"
        onPress={onPress}
        pressStyle={
          onPress
            ? { x: offset, y: offset, bg: pressBg, opacity: pressOpacity }
            : undefined
        }
        {...props}
      >
        {children}
      </XStack>
    </YStack>
  );
}
