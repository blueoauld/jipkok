import { Text, XStack, YStack } from "tamagui";

import { RETRO_SHADOW_OFFSET } from "@/lib/design";

export function RetroSegmentedControl<T extends string>({
  values,
  value,
  onChange,
}: {
  values: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <YStack theme="gray">
      <YStack
        position="absolute"
        t={RETRO_SHADOW_OFFSET}
        b={-RETRO_SHADOW_OFFSET}
        l={RETRO_SHADOW_OFFSET}
        r={-RETRO_SHADOW_OFFSET}
        bg="$gray8"
      />
      <XStack borderWidth={2} borderColor="$color12" bg="$color1">
        {values.map((item, index) => {
          const selected = item === value;

          return (
            <XStack
              key={item}
              theme={selected ? "blue" : undefined}
              flex={1}
              py="$1.5"
              justify="center"
              bg={selected ? "$color10" : "transparent"}
              borderColor="$color12"
              borderLeftWidth={index === 0 ? 0 : 2}
              pressStyle={{ bg: selected ? "$color10" : "$color3" }}
              onPress={() => onChange(item)}
            >
              <Text
                fontWeight={selected ? "700" : "400"}
                color={selected ? "white" : "$color12"}
              >
                {item}
              </Text>
            </XStack>
          );
        })}
      </XStack>
    </YStack>
  );
}
