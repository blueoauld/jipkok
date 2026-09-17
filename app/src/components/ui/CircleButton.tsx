import type { ReactNode } from "react";
import { XStack } from "tamagui";

import { FLOATING_BUTTON_SIZE, PILL_RADIUS } from "@/lib/design";

const TONES = {
  grey: { bg: "$grey100", pressBg: "$grey200" },
  blue: { bg: "$blue500", pressBg: "$blue600" },
} as const;

// 입력줄 양옆에 놓는 둥근 아이콘 버튼이다. 누를 수 없을 때는 눌림 색을 넣지 않는다.
export function CircleButton({
  label,
  tone,
  onPress,
  children,
}: {
  label: string;
  tone: keyof typeof TONES;
  onPress?: () => void;
  children: ReactNode;
}) {
  const { bg, pressBg } = TONES[tone];

  return (
    <XStack
      width={FLOATING_BUTTON_SIZE}
      height={FLOATING_BUTTON_SIZE}
      rounded={PILL_RADIUS}
      bg={bg}
      items="center"
      justify="center"
      pressStyle={onPress ? { bg: pressBg } : undefined}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
    >
      {children}
    </XStack>
  );
}
