import type { Icon } from "phosphor-react-native";
import { Text, useTheme, XStack } from "tamagui";

import { PRESS_OPACITY } from "@/lib/design";

const ICON_SIZE = 18;

export function WorryCount({
  icon: CountIcon,
  label,
  value,
  active = false,
  onPress,
}: {
  icon: Icon;
  label: string;
  value: number;
  active?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();

  return (
    <XStack
      items="center"
      gap="$1.5"
      pressStyle={onPress ? { opacity: PRESS_OPACITY } : undefined}
      accessible
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={`${label} ${value}`}
      accessibilityState={onPress ? { selected: active } : undefined}
      onPress={onPress}
    >
      <CountIcon
        size={ICON_SIZE}
        weight={active ? "fill" : "bold"}
        color={active ? theme.red500.val : theme.grey600.val}
      />
      <Text color="$grey600" fontSize="$2">
        {value}
      </Text>
    </XStack>
  );
}
