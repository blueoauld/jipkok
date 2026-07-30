import type { Icon, IconWeight } from "phosphor-react-native";
import { useTheme, XStack } from "tamagui";

const ICON_SIZE = 28;

export function HeaderIconButton({
  icon: Icon,
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
      pressStyle={{ opacity: 0.5 }}
      onPress={onPress}
    >
      <Icon size={ICON_SIZE} color={theme.color.val} />
    </XStack>
  );
}
