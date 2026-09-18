import { useState } from "react";
import { XStack, YStack } from "tamagui";

import { Text } from "@/components/ui/Text";
import { SEGMENT_SIZES, TRANSITION } from "@/lib/design";

// TDS 세그먼트 컨트롤에서 잰 값이다. 크기별 치수는 SEGMENT_SIZES에 있다.
const INDICATOR_SHADOW = "0 1px 2px rgba(0, 0, 0, 0.09)";

type SegmentedItem<T extends string> = {
  value: T;
  label: string;
};

export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  size = "large",
}: {
  items: readonly SegmentedItem<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: keyof typeof SEGMENT_SIZES;
}) {
  const spec = SEGMENT_SIZES[size];
  const indicatorInset = (spec.height - spec.itemHeight) / 2;
  const [trackWidth, setTrackWidth] = useState(0);
  const itemWidth = (trackWidth - spec.paddingX * 2) / items.length;
  const selectedIndex = Math.max(
    items.findIndex((item) => item.value === value),
    0,
  );

  return (
    <XStack
      minH={spec.height}
      px={spec.paddingX}
      items="center"
      rounded={spec.radius}
      bg="$greyOpacity100"
      accessibilityRole="radiogroup"
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
    >
      {trackWidth > 0 && (
        <YStack
          position="absolute"
          t={indicatorInset}
          b={indicatorInset}
          l={spec.paddingX}
          width={itemWidth}
          rounded={spec.itemRadius}
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
            minH={spec.itemHeight}
            items="center"
            justify="center"
            accessible
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(item.value)}
          >
            <Text
              fontSize={spec.fontSize}
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
