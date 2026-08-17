import type { Icon, IconWeight } from "phosphor-react-native";
import { useTheme, XStack } from "tamagui";

import { PRESS_OPACITY } from "@/lib/design";

const ICON_SIZE = 28;
const BUTTON_WIDTH = 36;
const BUTTON_HEIGHT = 40;

// 헤더에 아이콘 하나만 놓을 때 쓴다. 폭이 고정이라 자리가 흔들리지 않는다.
export function HeaderSoloIconButton({
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
      pressStyle={{ opacity: PRESS_OPACITY }}
      onPress={onPress}
    >
      <Icon size={ICON_SIZE} weight={weight} color={theme.color.val} />
    </XStack>
  );
}
