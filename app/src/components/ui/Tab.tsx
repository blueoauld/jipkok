import { useState } from "react";
import { Text, XStack, YStack } from "tamagui";

import { TRANSITION } from "@/lib/design";

// TDS 탭에서 잰 값이다. 칸은 폭을 똑같이 나눈다(TDS는 칸이 4개 이하일 때 이렇게 쓴다).
const PADDING_X = 20;
const ITEM_MIN_WIDTH = 64;
const ITEM_PADDING_X = 8;
const ITEM_PADDING_TOP = 12;
const ITEM_PADDING_BOTTOM = 14;
const INDICATOR_HEIGHT = 2;
const INDICATOR_INSET = 10;

type TabItem<T extends string> = {
  value: T;
  label: string;
};

export function Tab<T extends string>({
  items,
  value,
  onChange,
}: {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const [rowWidth, setRowWidth] = useState(0);
  const itemWidth = rowWidth / items.length;
  const selectedIndex = Math.max(
    items.findIndex((item) => item.value === value),
    0,
  );

  return (
    <YStack px={PADDING_X}>
      <XStack
        accessibilityRole="tablist"
        onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)}
      >
        {items.map((item) => {
          const selected = item.value === value;

          return (
            <XStack
              key={item.value}
              flex={1}
              minW={ITEM_MIN_WIDTH}
              px={ITEM_PADDING_X}
              pt={ITEM_PADDING_TOP}
              pb={ITEM_PADDING_BOTTOM}
              justify="center"
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => onChange(item.value)}
            >
              <Text
                numberOfLines={1}
                fontSize="$4"
                fontWeight={selected ? "700" : "600"}
                color={selected ? "$grey800" : "$grey600"}
              >
                {item.label}
              </Text>
            </XStack>
          );
        })}
      </XStack>

      <YStack height={INDICATOR_HEIGHT}>
        {rowWidth > 0 && (
          <YStack
            position="absolute"
            t={0}
            l={0}
            width={itemWidth - INDICATOR_INSET * 2}
            height={INDICATOR_HEIGHT}
            rounded={INDICATOR_HEIGHT / 2}
            bg="$grey800"
            x={selectedIndex * itemWidth + INDICATOR_INSET}
            transition={TRANSITION}
          />
        )}
      </YStack>
    </YStack>
  );
}
