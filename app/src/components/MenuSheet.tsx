import Svg, { Path } from "react-native-svg";
import { Text, useTheme, XStack, YStack } from "tamagui";

import { BottomSheet } from "@/components/ui/BottomSheet";
import {
  ROW_PRESS_RADIUS,
  ROW_PRESS_SCALE,
  SHEET_PADDING_X,
  TRANSITION,
} from "@/lib/design";

// TDS BottomSheet.Select에서 잰 값이다.
const LIST_PADDING_TOP = 8;
const LIST_PADDING_BOTTOM = 16;
const ROW_PADDING_Y = 16;

// TDS 선택지의 체크 아이콘을 옮겼다.
const CHECK_ICON_SIZE = 24;
const CHECK_ICON_PATH =
  "m10.4099 17.8538c-.3393 0-.67866-.1131-.90488-.4524l-5.20306-5.2031c-.56556-.5655-.56556-1.3573 0-1.9228.56555-.56559 1.35732-.56559 1.92287 0l4.18507 4.185 7.4653-7.46523c.5655-.56555 1.3573-.56555 1.9228 0 .5656.56555.5656 1.35732 0 1.92287l-8.3701 8.37016c-.3393.4524-.6787.5655-1.018.5655z";

export type MenuSheetItem = {
  label: string;
  destructive?: boolean;
  // 값을 주면 선택지로 보고 체크를 그린다. 동작 메뉴는 비워 둔다.
  selected?: boolean;
  onPress?: () => void;
};

export function MenuSheet({
  open,
  onOpenChange,
  items,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: MenuSheetItem[];
}) {
  const theme = useTheme();

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <YStack pt={LIST_PADDING_TOP} pb={LIST_PADDING_BOTTOM}>
        {items.map(({ label, destructive, selected, onPress }) => (
          <XStack
            key={label}
            items="center"
            px={SHEET_PADDING_X}
            py={ROW_PADDING_Y}
            rounded={ROW_PRESS_RADIUS}
            pressStyle={{ bg: "$greyOpacity100", scale: ROW_PRESS_SCALE }}
            transition={TRANSITION}
            accessible
            accessibilityRole={selected === undefined ? "button" : "radio"}
            accessibilityState={{ checked: selected }}
            onPress={() => {
              onOpenChange(false);
              onPress?.();
            }}
          >
            <Text
              flex={1}
              numberOfLines={1}
              fontSize="$4"
              fontWeight="500"
              color={destructive ? "$red500" : "$grey700"}
            >
              {label}
            </Text>

            {selected !== undefined && (
              <Svg
                width={CHECK_ICON_SIZE}
                height={CHECK_ICON_SIZE}
                viewBox="0 0 24 24"
              >
                <Path
                  d={CHECK_ICON_PATH}
                  fill={selected ? theme.blue500.val : theme.grey300.val}
                />
              </Svg>
            )}
          </XStack>
        ))}
      </YStack>
    </BottomSheet>
  );
}
