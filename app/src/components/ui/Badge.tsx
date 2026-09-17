import { Text, XStack } from "tamagui";

import { BADGE_HEIGHT, BADGE_RADIUS } from "@/lib/design";

// TDS 배지 small, red 채움에서 잰 값이다.
const PADDING_X = 7;
const FONT_SIZE = 12;

export function Badge({ children }: { children: string }) {
  return (
    <XStack
      shrink={0}
      minW={BADGE_HEIGHT}
      minH={BADGE_HEIGHT}
      px={PADDING_X}
      rounded={BADGE_RADIUS}
      bg="$red500"
      items="center"
      justify="center"
    >
      <Text color="$onFill" fontSize={FONT_SIZE} fontWeight="700">
        {children}
      </Text>
    </XStack>
  );
}
