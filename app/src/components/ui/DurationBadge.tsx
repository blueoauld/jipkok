import { XStack, type XStackProps } from "tamagui";

import { Text } from "@/components/ui/Text";
import { OVERLAY_BG, OVERLAY_INK, PILL_RADIUS } from "@/lib/design";
import { formatDuration } from "@/lib/video";

const PADDING_X = 6;
const PADDING_Y = 1;

// 영상 위 모서리에 얹는 길이 알약이다. 자리는 쓰는 쪽이 정한다.
export function DurationBadge({
  seconds,
  ...position
}: XStackProps & { seconds: number }) {
  return (
    <XStack
      position="absolute"
      px={PADDING_X}
      py={PADDING_Y}
      rounded={PILL_RADIUS}
      bg={OVERLAY_BG}
      {...position}
    >
      <Text preset="captionStrong" color={OVERLAY_INK}>
        {formatDuration(seconds)}
      </Text>
    </XStack>
  );
}
