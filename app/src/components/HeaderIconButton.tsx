import type { Icon, IconWeight } from "phosphor-react-native";
import { useTheme, XStack } from "tamagui";

import { PRESS_OPACITY } from "@/lib/design";

const ICON_SIZE = 28;

export function HeaderIconButton({
  icon: Icon,
  weight,
  onPress,
}: {
  icon: Icon;
  weight?: IconWeight;
  onPress?: () => void;
}) {
  const theme = useTheme();

  return (
    <XStack
      items="center"
      justify="center"
      p="$3"
      pressStyle={{ opacity: PRESS_OPACITY }}
      onPress={onPress}
    >
      <Icon size={ICON_SIZE} weight={weight} color={theme.color.val} />
    </XStack>
  );
}
