import { getTokens, Text, XStack, YStack } from "tamagui";

import { RetroShadow } from "@/components/ui/RetroShadow";
import { RETRO_BORDER_WIDTH } from "@/lib/design";
import { useAccent } from "@/lib/theme/accent";

export function RetroSegmentedControl<T extends string>({
  values,
  value,
  onChange,
}: {
  values: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  const accent = useAccent();
  const paddingY = getTokens().space["$1.5"].val + RETRO_BORDER_WIDTH;

  return (
    <YStack theme="gray">
      <RetroShadow color="$gray8" />
      <XStack bg="$color1" overflow="hidden">
        {values.map((item, index) => {
          const selected = item === value;

          return (
            <XStack
              key={item}
              theme={selected ? accent : undefined}
              flex={1}
              mr={index === values.length - 1 ? -RETRO_BORDER_WIDTH : 0}
              py={paddingY}
              justify="center"
              bg={selected ? "$color10" : "transparent"}
              borderColor="$gray12"
              borderLeftWidth={index === 0 ? 0 : RETRO_BORDER_WIDTH}
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
