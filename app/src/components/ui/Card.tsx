import { YStack, type YStackProps } from "tamagui";

import {
  CARD_PADDING,
  CARD_RADIUS,
  ROW_PRESS_SCALE,
  TRANSITION,
} from "@/lib/design";

// 회색 배경 위에 놓는 흰 카드다. 테두리와 그림자 없이 모서리만 둥글고, 누르면 목록 행처럼 옅은 회색 막이
// 덮이며 살짝 줄어든다.
export function Card({ onPress, children, ...props }: YStackProps) {
  return (
    <YStack
      group
      p={CARD_PADDING}
      rounded={CARD_RADIUS}
      bg="$layeredBackground"
      overflow="hidden"
      pressStyle={onPress ? { scale: ROW_PRESS_SCALE } : undefined}
      transition={TRANSITION}
      onPress={onPress}
      {...props}
    >
      {children}

      {onPress && (
        <YStack
          fullscreen
          bg="$greyOpacity100"
          opacity={0}
          pointerEvents="none"
          $group-press={{ opacity: 1 }}
        />
      )}
    </YStack>
  );
}
