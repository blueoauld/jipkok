import { useState } from "react";
import { Text, XStack, YStack } from "tamagui";

import {
  SEGMENT_HEIGHT,
  SEGMENT_ITEM_HEIGHT,
  SEGMENT_ITEM_RADIUS,
  SEGMENT_RADIUS,
  TRANSITION,
} from "@/lib/design";

// TDS 세그먼트 컨트롤에서 잰 값이다.
const TRACK_PADDING_X = 5;
const TRACK_PADDING_Y = (SEGMENT_HEIGHT - SEGMENT_ITEM_HEIGHT) / 2;
const INDICATOR_SHADOW = "0 1px 2px rgba(0, 0, 0, 0.09)";

export type SegmentedItem<T extends string> = {
  value: T;
  label: string;
};

export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
}: {
  items: readonly SegmentedItem<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const itemWidth = (trackWidth - TRACK_PADDING_X * 2) / items.length;
  const selectedIndex = Math.max(
    items.findIndex((item) => item.value === value),
    0,
  );

  return (
    <XStack
      height={SEGMENT_HEIGHT}
      px={TRACK_PADDING_X}
      items="center"
      rounded={SEGMENT_RADIUS}
      bg="$greyOpacity100"
      accessibilityRole="radiogroup"
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
    >
      {trackWidth > 0 && (
        <YStack
          position="absolute"
          t={TRACK_PADDING_Y}
          l={TRACK_PADDING_X}
          width={itemWidth}
          height={SEGMENT_ITEM_HEIGHT}
          rounded={SEGMENT_ITEM_RADIUS}
          bg="$segmentedIndicator"
          boxShadow={INDICATOR_SHADOW}
          x={selectedIndex * itemWidth}
          transition={TRANSITION}
        />
      )}

      {items.map((item) => {
        const selected = item.value === value;

        return (
          <XStack
            key={item.value}
            flex={1}
            height={SEGMENT_ITEM_HEIGHT}
            items="center"
            justify="center"
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(item.value)}
          >
            <Text
              fontSize="$4"
              fontWeight={selected ? "600" : "500"}
              color={selected ? "$grey800" : "$grey600"}
            >
              {item.label}
            </Text>
          </XStack>
        );
      })}
    </XStack>
  );
}
