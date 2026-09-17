import { LockSimpleIcon } from "phosphor-react-native/src/icons/LockSimple";
import { useTheme, XStack, type XStackProps } from "tamagui";

import { BADGE_SIZES, DARK_FILL } from "@/lib/design";

const ICON_SIZE = 14;

export function LockBadge(props: XStackProps) {
  const theme = useTheme();

  return (
    <XStack
      position="absolute"
      width={BADGE_SIZES.small.height}
      height={BADGE_SIZES.small.height}
      rounded={BADGE_SIZES.small.radius}
      bg={DARK_FILL}
      items="center"
      justify="center"
      {...props}
    >
      <LockSimpleIcon size={ICON_SIZE} weight="fill" color={theme.onFill.val} />
    </XStack>
  );
}
