import type { ReactNode } from "react";
import { XStack } from "tamagui";

import { PILL_RADIUS, ROUND_BUTTON_SIZE } from "@/lib/design";

const TONES = {
  grey: { bg: "$grey100", pressBg: "$grey200" },
  blue: { bg: "$blue500", pressBg: "$blue600" },
  translucentBlue: {
    bg: "$blue500Translucent",
    pressBg: "$blue600Translucent",
  },
} as const;

// 입력줄 양옆과 내용 위에 떠 있는 자리에 놓는 둥근 아이콘 버튼이다. 누를 수 없을 때는 눌림 색을 넣지 않는다.
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
      width={ROUND_BUTTON_SIZE}
      height={ROUND_BUTTON_SIZE}
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
