import type { Icon } from "phosphor-react-native";
import { Text, useTheme, XStack } from "tamagui";

import { PRESS_OPACITY } from "@/lib/design";

export function WorryCount({
  icon: CountIcon,
  value,
  size,
  active = false,
  onPress,
}: {
  icon: Icon;
  value: number;
  size: number;
  active?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();

  return (
    <XStack
      items="center"
      gap="$1.5"
      pressStyle={onPress ? { opacity: PRESS_OPACITY } : undefined}
      onPress={onPress}
    >
      <CountIcon
        size={size}
        weight={active ? "fill" : "bold"}
        color={active ? theme.red10.val : theme.gray11.val}
      />
      <Text theme="gray" color="$color11" fontSize="$2">
        {value}
      </Text>
    </XStack>
  );
}
