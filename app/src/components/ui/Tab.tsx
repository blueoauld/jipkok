import { useState } from "react";
import { type LayoutRectangle, ScrollView } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { TRANSITION } from "@/lib/design";

// TDS 탭(fluid)에서 잰 값이다. 칸은 글자 폭만큼이고 넘치면 옆으로 스크롤한다.
const PADDING_LEFT = 14;
const ITEM_MIN_WIDTH = 64;
const ITEM_PADDING_X = 12;
const ITEM_PADDING_TOP = 12;
const ITEM_PADDING_BOTTOM = 14;
const INDICATOR_HEIGHT = 2;
const INDICATOR_INSET = 10;

export type TabItem<T extends string> = {
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
  const [layouts, setLayouts] = useState<LayoutRectangle[]>([]);
  const selected = layouts[items.findIndex((item) => item.value === value)];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingLeft: PADDING_LEFT }}
    >
      <YStack pb={INDICATOR_HEIGHT}>
        <XStack accessibilityRole="tablist">
          {items.map((item, index) => {
            const active = item.value === value;

            return (
              <XStack
                key={item.value}
                minW={ITEM_MIN_WIDTH}
                px={ITEM_PADDING_X}
                pt={ITEM_PADDING_TOP}
                pb={ITEM_PADDING_BOTTOM}
                justify="center"
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onLayout={(event) => {
                  const { layout } = event.nativeEvent;

                  setLayouts((previous) => {
                    const next = [...previous];
                    next[index] = layout;
                    return next;
                  });
                }}
                onPress={() => onChange(item.value)}
              >
                <Text
                  fontSize="$4"
                  fontWeight={active ? "700" : "600"}
                  color={active ? "$grey800" : "$grey600"}
                >
                  {item.label}
                </Text>
              </XStack>
            );
          })}
        </XStack>

        {selected && (
          <YStack
            position="absolute"
            b={0}
            l={0}
            width={selected.width - INDICATOR_INSET * 2}
            height={INDICATOR_HEIGHT}
            rounded={INDICATOR_HEIGHT / 2}
            bg="$grey800"
            x={selected.x + INDICATOR_INSET}
            transition={TRANSITION}
          />
        )}
      </YStack>
    </ScrollView>
  );
}
