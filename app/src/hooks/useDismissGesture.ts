import { animations } from "@tamagui/config/v5-reanimated";
import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { TRANSITION } from "@/lib/design";

// 시트, 다이얼로그와 같은 스프링으로 되돌아간다.
const SPRING = animations.animations[TRANSITION];

const DISMISS_DISTANCE = 120;

const DISMISS_VELOCITY = 800;

const DISMISS_DURATION = 200;

const GESTURE_SLOP = 20;

export function useDismissGesture({
  enabled = true,
  onClose,
}: {
  enabled?: boolean;
  onClose: () => void;
}) {
  const screen = useWindowDimensions();
  const translateY = useSharedValue(0);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .activeOffsetY([-GESTURE_SLOP, GESTURE_SLOP])
        .failOffsetX([-GESTURE_SLOP, GESTURE_SLOP])
        .onUpdate((event) => {
          translateY.value = event.translationY;
        })
        .onEnd((event) => {
          const dragged = Math.abs(event.translationY) > DISMISS_DISTANCE;
          const flicked = Math.abs(event.velocityY) > DISMISS_VELOCITY;

          if (!dragged && !flicked) {
            translateY.value = withSpring(0, SPRING);
            return;
          }

          const direction = event.translationY > 0 ? 1 : -1;

          translateY.value = withTiming(
            direction * screen.height,
            { duration: DISMISS_DURATION },
            (finished) => {
              if (finished) {
                scheduleOnRN(onClose);
              }
            },
          );
        }),
    [enabled, onClose, screen.height, translateY],
  );

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      Math.abs(translateY.value),
      [0, screen.height / 2],
      [1, 0],
      "clamp",
    ),
  }));

  return { gesture, contentStyle, backdropStyle };
}
