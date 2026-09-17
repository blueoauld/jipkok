import { LockSimpleIcon } from "phosphor-react-native/src/icons/LockSimple";
import { useTheme, XStack, type XStackProps } from "tamagui";

import { BADGE_HEIGHT, BADGE_RADIUS } from "@/lib/design";

const ICON_SIZE = 14;

// TDS elephant 채움 배지 색이다. TDS 채움 배지는 다크에서도 그대로라, 다크에서 밝아지는
// $grey700 대신 라이트 값을 고정한다.
const BACKGROUND = "#4E5968";

export function LockBadge(props: XStackProps) {
  const theme = useTheme();

  return (
    <XStack
      position="absolute"
      width={BADGE_HEIGHT}
      height={BADGE_HEIGHT}
      rounded={BADGE_RADIUS}
      bg={BACKGROUND}
      items="center"
      justify="center"
      {...props}
    >
      <LockSimpleIcon size={ICON_SIZE} weight="fill" color={theme.onFill.val} />
    </XStack>
  );
}
