import { XStack } from "tamagui";

import { Text } from "@/components/ui/Text";
import { BADGE_SIZES, DARK_FILL } from "@/lib/design";

// TDS 배지의 색 조합이다. 약한 배지는 글자색의 16% 면을 깐다.
const TONES = {
  "red-fill": { bg: "$red500", color: "$onFill" },
  "elephant-fill": { bg: DARK_FILL, color: "$onFill" },
  "elephant-weak": { bg: "$elephantBadgeBackground", color: "$grey700" },
} as const;

export function Badge({
  size = "small",
  tone = "red-fill",
  children,
}: {
  size?: keyof typeof BADGE_SIZES;
  tone?: keyof typeof TONES;
  children: string;
}) {
  const spec = BADGE_SIZES[size];
  const { bg, color } = TONES[tone];

  return (
    <XStack
      shrink={0}
      minW={spec.height}
      minH={spec.height}
      px={spec.paddingX}
      rounded={spec.radius}
      bg={bg}
      items="center"
      justify="center"
    >
      <Text color={color} fontSize={spec.fontSize} fontWeight={spec.fontWeight}>
        {children}
      </Text>
    </XStack>
  );
}
