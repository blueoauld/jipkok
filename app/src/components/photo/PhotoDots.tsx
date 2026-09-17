import { XStack, YStack } from "tamagui";

import { OVERLAY_BG, OVERLAY_INK, PILL_RADIUS } from "@/lib/design";

const DOT_SIZE = 6;

const INACTIVE_DOT_OPACITY = 0.4;

export function PhotoDots({ count, index }: { count: number; index: number }) {
  if (count < 2) {
    return null;
  }

  return (
    <XStack
      self="center"
      px="$3"
      py="$2"
      rounded={PILL_RADIUS}
      bg={OVERLAY_BG}
      gap="$2"
    >
      {Array.from({ length: count }, (_, dotIndex) => (
        <YStack
          key={dotIndex}
          width={DOT_SIZE}
          height={DOT_SIZE}
          rounded={PILL_RADIUS}
          bg={OVERLAY_INK}
          opacity={dotIndex === index ? 1 : INACTIVE_DOT_OPACITY}
        />
      ))}
    </XStack>
  );
}
