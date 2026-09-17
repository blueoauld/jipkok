import { getTokens, Text, XStack, YStack } from "tamagui";

import { RetroShadow } from "@/components/ui/RetroShadow";
import { RETRO_BORDER_WIDTH } from "@/lib/design";

export type SegmentedItem<T extends string> = {
  value: T;
  label: string;
};

export function RetroSegmentedControl<T extends string>({
  items,
  value,
  onChange,
}: {
  items: readonly SegmentedItem<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const paddingY = getTokens().space["$1.5"].val + RETRO_BORDER_WIDTH;

  return (
    <YStack theme="gray">
      <RetroShadow color="$gray8" />
      <XStack bg="$color1" overflow="hidden">
        {items.map((item, index) => {
          const selected = item.value === value;

          return (
            <XStack
              key={item.value}
              theme={selected ? "blue" : undefined}
              flex={1}
              mr={index === items.length - 1 ? -RETRO_BORDER_WIDTH : 0}
              py={paddingY}
              justify="center"
              bg={selected ? "$color10" : "transparent"}
              borderColor="$gray12"
              borderLeftWidth={index === 0 ? 0 : RETRO_BORDER_WIDTH}
              pressStyle={{ bg: selected ? "$color10" : "$color3" }}
              onPress={() => onChange(item.value)}
            >
              <Text
                fontWeight={selected ? "700" : "400"}
                color={selected ? "$onFill" : "$color12"}
              >
                {item.label}
              </Text>
            </XStack>
          );
        })}

        <YStack
          fullscreen
          borderWidth={RETRO_BORDER_WIDTH}
          borderColor="$gray12"
          pointerEvents="none"
        />
      </XStack>
    </YStack>
  );
}
