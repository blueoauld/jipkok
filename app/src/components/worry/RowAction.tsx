import { Text, XStack } from "tamagui";

import { DISABLED_OPACITY, PRESS_OPACITY } from "@/lib/design";

// 글자가 작아 손가락이 닿을 자리를 둘레로 넓힌다.
const HIT_SLOP = 8;

export function RowAction({
  label,
  destructive,
  disabled,
  onPress,
}: {
  label: string;
  destructive?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <XStack
      hitSlop={HIT_SLOP}
      pressStyle={disabled ? undefined : { opacity: PRESS_OPACITY }}
      accessible
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={disabled ? undefined : onPress}
    >
      <Text
        color={destructive ? "$red500" : "$grey600"}
        fontSize="$1"
        fontWeight="600"
        opacity={disabled ? DISABLED_OPACITY : 1}
      >
        {label}
      </Text>
    </XStack>
  );
}
