import type { ReactNode } from "react";
import { XStack } from "tamagui";

import { PILL_RADIUS, ROUND_BUTTON_SIZE } from "@/lib/design";

// 내용 위에 떠 있는 원형 버튼이다. 그림자 없는 파란 원이라 아이콘은 흰색으로 넘긴다.
export function FloatingButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <XStack
      width={ROUND_BUTTON_SIZE}
      height={ROUND_BUTTON_SIZE}
      rounded={PILL_RADIUS}
      bg="$blue500"
      items="center"
      justify="center"
      pressStyle={{ bg: "$blue600" }}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
    >
      {children}
    </XStack>
  );
}
