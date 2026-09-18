import { useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { XStack, YStack } from "tamagui";

import { Text } from "@/components/ui/Text";
import { OVERLAY_INK, PILL_RADIUS } from "@/lib/design";
import i18n from "@/lib/i18n";
import { formatDuration } from "@/lib/video";

export const SEEK_STEP_SECONDS = 10;

const TRACK_BG = "rgba(255, 255, 255, 0.35)";
const TRACK_HEIGHT = 4;
const THUMB_SIZE = 16;
export const TRACK_HIT_SLOP = 12;

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function SeekBar({
  position,
  duration,
  onSeek,
  onScrubStart,
}: {
  position: number;
  duration: number;
  onSeek: (seconds: number) => void;
  onScrubStart: () => void;
}) {
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState<number | null>(null);

  const onLayout = (event: LayoutChangeEvent) =>
    setWidth(event.nativeEvent.layout.width);

  const ratioOf = (x: number) => (width > 0 ? clamp(x / width) : 0);

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((event) => {
      onScrubStart();
      setDragging(ratioOf(event.x));
    })
    .onUpdate((event) => setDragging(ratioOf(event.x)))
    // 움직임 없는 탭은 Pan이 실패로 끝나므로 성공 여부와 상관없이 놓은 자리로 간다.
    .onFinalize((event) => {
      onSeek(ratioOf(event.x) * duration);
      setDragging(null);
    })
    .runOnJS(true);

  const shown = dragging !== null ? dragging * duration : position;
  const ratio = duration > 0 ? clamp(shown / duration) : 0;

  return (
    <XStack items="center" gap="$3">
      <Text preset="subStrong" color={OVERLAY_INK}>
        {formatDuration(Math.floor(shown))}
      </Text>

      <GestureDetector gesture={pan}>
        <YStack
          flex={1}
          py={TRACK_HIT_SLOP}
          justify="center"
          onLayout={onLayout}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={i18n.t("a11y.seekBar")}
          accessibilityValue={{
            min: 0,
            max: Math.floor(duration),
            now: Math.floor(shown),
            text: formatDuration(Math.floor(shown)),
          }}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(event) => {
            const step =
              event.nativeEvent.actionName === "increment"
                ? SEEK_STEP_SECONDS
                : -SEEK_STEP_SECONDS;

            onSeek(Math.min(duration, Math.max(0, position + step)));
          }}
        >
          <YStack height={TRACK_HEIGHT} bg={TRACK_BG}>
            <YStack
              height={TRACK_HEIGHT}
              width={width * ratio}
              bg={OVERLAY_INK}
            />
          </YStack>

          <YStack
            position="absolute"
            l={width * ratio - THUMB_SIZE / 2}
            width={THUMB_SIZE}
            height={THUMB_SIZE}
            rounded={PILL_RADIUS}
            bg={OVERLAY_INK}
          />
        </YStack>
      </GestureDetector>

      <Text preset="subStrong" color={OVERLAY_INK}>
        {formatDuration(Math.floor(duration))}
      </Text>
    </XStack>
  );
}
