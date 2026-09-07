import { animations } from "@tamagui/config/v5-reanimated";
import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import {
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { TRANSITION } from "@/lib/design";

// 시트, 다이얼로그와 같은 스프링으로 되돌아간다.
const SPRING = animations.animations[TRANSITION];

export const DISMISS_DISTANCE = 120;

const DISMISS_VELOCITY = 800;

export const DISMISS_DURATION = 200;

const GESTURE_SLOP = 20;

export function shouldDismiss(translationY: number, velocityY: number) {
  "worklet";

  return (
    Math.abs(translationY) > DISMISS_DISTANCE ||
    Math.abs(velocityY) > DISMISS_VELOCITY
  );
}

export function useDismissStyles(translateY: SharedValue<number>) {
  const screen = useWindowDimensions();

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      Math.abs(translateY.value),
      [0, screen.height / 2],
      [1, 0],
      "clamp",
    ),
  }));

  // 버튼은 배경보다 빨리 사라져서 손가락이 움직이는 게 콘텐츠뿐임을 보여준다.
  const chromeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      Math.abs(translateY.value),
      [0, DISMISS_DISTANCE],
      [1, 0],
      "clamp",
    ),
  }));

  return { backdropStyle, chromeStyle };
}

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
          if (!shouldDismiss(event.translationY, event.velocityY)) {
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

  return { gesture, contentStyle, ...useDismissStyles(translateY) };
}
