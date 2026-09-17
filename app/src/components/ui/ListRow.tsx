import type { Icon } from "phosphor-react-native";
import type { ReactNode } from "react";
import Svg, { Path } from "react-native-svg";
import { useTheme, XStack, YStack } from "tamagui";

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

// 목록 맨 위 빈칸이다. 행 사이에는 선 없이 아래 여백과 위 여백이 붙으므로, 첫 행 위 공간을 이와 맞추려고
// 여백 하나만큼 띄운다. 행 위아래 여백을 바꾼 목록은 같은 값을 넘기고, 행 안에서 위아래로 뜨는 요소가
// 있으면 뜬 만큼을 extra로 더한다. 탭이나 헤더 바로 아래에서 시작하는 목록의 ListHeaderComponent로 넣는다.
export function ListRowTopSpacer({
  verticalPadding = LIST_ROW_VERTICAL_PADDING.medium,
  extra = 0,
}: {
  verticalPadding?: number;
  extra?: number;
}) {
  return <YStack height={verticalPadding + extra} />;
}

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
  horizontalPadding = "medium",
  verticalPadding = LIST_ROW_VERTICAL_PADDING.medium,
  onPress,
  children,
}: {
  left?: ReactNode;
  right?: ReactNode;
  withArrow?: boolean;
  horizontalPadding?: keyof typeof LIST_ROW_PADDING_X;
  verticalPadding?: number;
  onPress?: () => void;
  children: ReactNode;
}) {
  const theme = useTheme();

  return (
    <XStack
      items="center"
      minH={MIN_HEIGHT}
      px={LIST_ROW_PADDING_X[horizontalPadding]}
      py={verticalPadding}
      rounded={ROW_PRESS_RADIUS}
      pressStyle={
        onPress ? { bg: "$greyOpacity100", scale: ROW_PRESS_SCALE } : undefined
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
  );
}
