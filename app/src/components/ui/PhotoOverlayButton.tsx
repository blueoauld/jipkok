import type { ReactNode } from "react";
import { XStack, type XStackProps } from "tamagui";

import { BADGE_SIZES, PILL_RADIUS, PRESS_OPACITY, tapSlop } from "@/lib/design";

// 사진 칸 위 모서리에 얹는 작은 원형 버튼이다. 잠금 배지와 같은 크기다.
const SIZE = BADGE_SIZES.small.height;

const TAP_SLOP = tapSlop({ width: SIZE, height: SIZE });

export function PhotoOverlayButton({
  label,
  bg,
  onPress,
  children,
  ...position
}: {
  label?: string;
  bg: XStackProps["bg"];
  onPress?: () => void;
  children: ReactNode;
} & XStackProps) {
  return (
    <XStack
      position="absolute"
      width={SIZE}
      height={SIZE}
      rounded={PILL_RADIUS}
      bg={bg}
      items="center"
      justify="center"
      pressStyle={onPress ? { opacity: PRESS_OPACITY } : undefined}
      hitSlop={onPress ? TAP_SLOP : undefined}
      accessible={label !== undefined}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={label}
      onPress={onPress}
      {...position}
    >
      {children}
    </XStack>
  );
}
