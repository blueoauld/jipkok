import type { Icon } from "phosphor-react-native";
import type { ReactNode } from "react";
import Svg, { Path } from "react-native-svg";
import { useTheme, XStack, YStack } from "tamagui";

import { Border } from "@/components/ui/Border";
import {
  LIST_ROW_LEFT_GAP,
  LIST_ROW_PADDING_X,
  LIST_ROW_VERTICAL_PADDING,
  ROW_PRESS_RADIUS,
  ROW_PRESS_SCALE,
  TRANSITION,
} from "@/lib/design";

// TDS ListRow에서 잰 값이다.
const MIN_HEIGHT = 44;
const RIGHT_GAP = 16;
const ICON_BOX_SIZE = 30;
const ICON_SIZE = 24;

// TDS 화살표 아이콘을 옮겼다. 글자에서 4 떨어지고 오른쪽 여백 안으로 8 들어간다.
const ARROW_SIZE = 24;
const ARROW_PATH =
  "m10.379 17.043c-.205 0-.409-.078-.565-.234-.312-.312-.312-.818 0-1.131l3.677-3.678-3.677-3.678c-.312-.312-.312-.819 0-1.131s.819-.312 1.131 0l4.242 4.243c.312.312.312.819 0 1.131l-4.242 4.243c-.156.156-.361.234-.566.234z";
const ARROW_GAP = 4;
const ARROW_OVERHANG = 8;

// TDS ListRow의 기본 아이콘 칸(30)에 아이콘을 둔다.
export function ListRowIcon({ icon: IconComponent }: { icon: Icon }) {
  const theme = useTheme();

  return (
    <XStack
      width={ICON_BOX_SIZE}
      height={ICON_BOX_SIZE}
      items="center"
      justify="center"
    >
      <IconComponent size={ICON_SIZE} color={theme.grey700.val} />
    </XStack>
  );
}

export function ListRow({
  left,
  right,
  withArrow = false,
  divider = false,
  horizontalPadding = "medium",
  onPress,
  children,
}: {
  left?: ReactNode;
  right?: ReactNode;
  withArrow?: boolean;
  divider?: boolean;
  horizontalPadding?: keyof typeof LIST_ROW_PADDING_X;
  onPress?: () => void;
  children: ReactNode;
}) {
  const theme = useTheme();

  return (
    <YStack>
      <XStack
        items="center"
        minH={MIN_HEIGHT}
        px={LIST_ROW_PADDING_X[horizontalPadding]}
        py={LIST_ROW_VERTICAL_PADDING.medium}
        rounded={ROW_PRESS_RADIUS}
        pressStyle={
          onPress
            ? { bg: "$greyOpacity100", scale: ROW_PRESS_SCALE }
            : undefined
        }
        transition={TRANSITION}
        accessibilityRole={onPress ? "button" : undefined}
        onPress={onPress}
      >
        {left && <XStack mr={LIST_ROW_LEFT_GAP}>{left}</XStack>}

        <XStack flex={1} items="center" gap={RIGHT_GAP}>
          <YStack flex={1}>{children}</YStack>
          {right}
        </XStack>

        {withArrow && (
          <XStack ml={ARROW_GAP} mr={-ARROW_OVERHANG}>
            <Svg width={ARROW_SIZE} height={ARROW_SIZE} viewBox="0 0 24 24">
              <Path d={ARROW_PATH} fill={theme.grey400.val} />
            </Svg>
          </XStack>
        )}
      </XStack>

      {divider && (
        <YStack position="absolute" b={0} l={0} r={0}>
          <Border variant="padding24" />
        </YStack>
      )}
    </YStack>
  );
}
