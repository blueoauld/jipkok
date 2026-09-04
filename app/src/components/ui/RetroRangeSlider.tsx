import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { type LayoutChangeEvent, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useTheme, YStack } from "tamagui";

import { RETRO_BORDER_WIDTH } from "@/lib/design";
import { useAccentColor } from "@/lib/theme/accent";

const TRACK_HEIGHT = 4;
const THUMB_SIZE = 24;
const THUMB_HIT_SLOP = 12;

const ADJUST_ACTIONS = [{ name: "increment" }, { name: "decrement" }];

function Thumb({
  position,
  otherPosition,
  isLower,
  width,
  borderColor,
  label,
  value,
  min,
  max,
  onMove,
  onStep,
}: {
  position: SharedValue<number>;
  otherPosition: SharedValue<number>;
  isLower: boolean;
  width: number;
  borderColor: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onMove: (ratio: number) => void;
  onStep: (delta: number) => void;
}) {
  const start = useSharedValue(0);

  const pan = Gesture.Pan()
    .hitSlop(THUMB_HIT_SLOP)
    .onBegin(() => {
      start.value = position.value;
    })
    .onUpdate((event) => {
      const raw = start.value + event.translationX;
      const lower = isLower ? 0 : otherPosition.value;
      const upper = isLower ? otherPosition.value : width;
      const next = Math.min(upper, Math.max(lower, raw));

      position.value = next;
      runOnJS(onMove)(width > 0 ? next / width : 0);
    });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value - THUMB_SIZE / 2 }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: value, text: String(value) }}
        accessibilityActions={ADJUST_ACTIONS}
        onAccessibilityAction={(event) =>
          onStep(event.nativeEvent.actionName === "increment" ? 1 : -1)
        }
        style={[
          styles.thumb,
          { borderColor, borderWidth: RETRO_BORDER_WIDTH },
          style,
        ]}
      />
    </GestureDetector>
  );
}

// 값은 스텝 단위로 스냅하고, 두 손잡이는 서로 넘어가지 못한다(같은 값은 된다).
export function RetroRangeSlider({
  min,
  max,
  values,
  lowerLabel,
  upperLabel,
  onChange,
}: {
  min: number;
  max: number;
  values: [number, number];
  lowerLabel: string;
  upperLabel: string;
  onChange: (values: [number, number]) => void;
}) {
  const theme = useTheme();
  const accent = useAccentColor();
  const [width, setWidth] = useState(0);
  const lower = useSharedValue(0);
  const upper = useSharedValue(0);

  const span = max - min;
  const toRatio = (value: number) => (value - min) / span;
  const toValue = (ratio: number) => Math.round(min + ratio * span);

  const onLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;

    setWidth(next);
    lower.value = toRatio(values[0]) * next;
    upper.value = toRatio(values[1]) * next;
  };

  // 초기화처럼 밖에서 값이 바뀌면 손잡이를 옮긴다. 드래그 중에는 값이 손잡이를
  // 따라오므로 같은 값이라 건드리지 않아, 스텝에 맞춰 튀지 않는다.
  useEffect(() => {
    if (width === 0) {
      return;
    }

    if (toValue(lower.value / width) !== values[0]) {
      lower.value = toRatio(values[0]) * width;
    }

    if (toValue(upper.value / width) !== values[1]) {
      upper.value = toRatio(values[1]) * width;
    }
  });

  const moveLower = (ratio: number) => {
    const next = Math.min(toValue(ratio), values[1]);

    if (next !== values[0]) {
      Haptics.selectionAsync();
      onChange([next, values[1]]);
    }
  };

  const moveUpper = (ratio: number) => {
    const next = Math.max(toValue(ratio), values[0]);

    if (next !== values[1]) {
      Haptics.selectionAsync();
      onChange([values[0], next]);
    }
  };

  // 스크린 리더의 올리기, 내리기는 한 칸씩 움직인다. 손잡이 위치는 값이 바뀌면 효과가 맞춘다.
  const stepLower = (delta: number) =>
    moveLower(toRatio(Math.max(min, values[0] + delta)));

  const stepUpper = (delta: number) =>
    moveUpper(toRatio(Math.min(max, values[1] + delta)));

  // 트랙을 탭하면 가까운 손잡이가 그 자리로 온다. 두 손잡이가 겹쳐 있으면 탭한 쪽이 움직인다.
  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd((event) => {
      if (width === 0) {
        return;
      }

      const x = Math.min(width, Math.max(0, event.x));
      const toLower = Math.abs(x - lower.value);
      const toUpper = Math.abs(x - upper.value);
      const pickLower =
        toLower < toUpper || (toLower === toUpper && x < lower.value);

      if (pickLower) {
        lower.value = x;
        moveLower(x / width);
      } else {
        upper.value = x;
        moveUpper(x / width);
      }
    });

  const rangeStyle = useAnimatedStyle(() => ({
    left: lower.value,
    width: Math.max(0, upper.value - lower.value),
  }));

  // 손잡이 반쪽만큼 안쪽에서 트랙을 시작해, 양 끝 손잡이가 컨테이너 밖으로 나가지 않는다.
  return (
    <GestureDetector gesture={tap}>
      <YStack height={THUMB_SIZE} justify="center" mx={THUMB_SIZE / 2}>
        <YStack height={TRACK_HEIGHT} bg="$gray6" onLayout={onLayout}>
          <Animated.View
            style={[styles.range, { backgroundColor: accent }, rangeStyle]}
          />
        </YStack>

        {width > 0 && (
          <>
            <Thumb
              position={lower}
              otherPosition={upper}
              isLower
              width={width}
              borderColor={theme.gray12.val}
              label={lowerLabel}
              value={values[0]}
              min={min}
              max={max}
              onMove={moveLower}
              onStep={stepLower}
            />
            <Thumb
              position={upper}
              otherPosition={lower}
              isLower={false}
              width={width}
              borderColor={theme.gray12.val}
              label={upperLabel}
              value={values[1]}
              min={min}
              max={max}
              onMove={moveUpper}
              onStep={stepUpper}
            />
          </>
        )}
      </YStack>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  range: {
    position: "absolute",
    top: 0,
    bottom: 0,
  },
  thumb: {
    position: "absolute",
    top: 0,
    left: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    backgroundColor: "white",
  },
});
