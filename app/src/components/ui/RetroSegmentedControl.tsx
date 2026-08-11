import { useState } from "react";
import { Text, XStack, YStack } from "tamagui";

const SHADOW_OFFSET = 4;

export function RetroSegmentedControl<T extends string>({
  values,
  value,
  onChange,
}: {
  values: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <YStack theme="gray">
      <YStack
        position="absolute"
        t={SHADOW_OFFSET}
        b={-SHADOW_OFFSET}
        l={SHADOW_OFFSET}
        r={-SHADOW_OFFSET}
        bg="$color8"
      />
      <XStack
        borderWidth={2}
        borderColor="$color12"
        bg="$color1"
        x={pressed ? SHADOW_OFFSET : 0}
        y={pressed ? SHADOW_OFFSET : 0}
      >
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
              pressStyle={{ bg: selected ? "$color10" : "$color4" }}
              onPressIn={() => setPressed(true)}
              onPressOut={() => setPressed(false)}
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
