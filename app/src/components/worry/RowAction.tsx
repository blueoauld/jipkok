import { Text, XStack } from "tamagui";

import { DISABLED_OPACITY, PRESS_OPACITY } from "@/lib/design";

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
      pressStyle={disabled ? undefined : { opacity: PRESS_OPACITY }}
      onPress={disabled ? undefined : onPress}
    >
      <Text
        theme="gray"
        color={destructive ? "$red10" : "$color11"}
        fontSize="$3"
        fontWeight="600"
        opacity={disabled ? DISABLED_OPACITY : 1}
      >
        {label}
      </Text>
    </XStack>
  );
}
