import type { Icon, IconWeight } from "phosphor-react-native";
import { useTheme, XStack } from "tamagui";

import { PRESS_OPACITY } from "@/lib/design";

const ICON_SIZE = 28;
const BUTTON_WIDTH = 36;
const BUTTON_HEIGHT = 40;

// 네이티브 스택 헤더 전용이다. iOS 26이 UINavigationBar 버튼에 유리를 알아서 입히므로
// 여기서 GlassSurface를 쓰면 두 겹이 된다. 탭 헤더는 HeaderIconButton을 쓸 것.
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
