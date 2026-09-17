import type { Icon, IconWeight } from "phosphor-react-native";
import { useTheme, XStack } from "tamagui";

import { PRESS_OPACITY, tapSlop } from "@/lib/design";

const ICON_SIZE = 28;
const BUTTON_WIDTH = 36;
const BUTTON_HEIGHT = 40;

// 크기를 키우면 iOS 26이 입히는 유리도 같이 커져 뒤로가기 버튼과 어긋난다. 닿는 면만 넓힌다.
const TAP_SLOP = tapSlop({ width: BUTTON_WIDTH, height: BUTTON_HEIGHT });

// 네이티브 스택 헤더에 놓는다. iOS 26이 UINavigationBar 버튼에 유리를 알아서 입히므로 유리를 따로 깔지 않는다.
export function HeaderIconButton({
  icon: Icon,
  label,
  weight,
  selected,
  onPress,
}: {
  icon: Icon;
  label: string;
  weight?: IconWeight;
  selected?: boolean;
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
      hitSlop={TAP_SLOP}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
    >
      <Icon size={ICON_SIZE} weight={weight} color={theme.grey900.val} />
    </XStack>
  );
}
