import type { Icon, IconWeight } from "phosphor-react-native";
import { useTheme, XStack } from "tamagui";

const ICON_SIZE = 28;
const BUTTON_WIDTH = 36;
const BUTTON_HEIGHT = 40;

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
      width={BUTTON_WIDTH}
      height={BUTTON_HEIGHT}
      items="center"
      justify="center"
      pressStyle={{ opacity: 0.5 }}
      onPress={onPress}
    >
      <Icon size={ICON_SIZE} weight={weight} color={theme.color.val} />
    </XStack>
  );
}
