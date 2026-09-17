import { useEffect } from "react";
import { Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Sheet, Text, useTheme, XStack, YStack } from "tamagui";

import { useCloseOnGoBack } from "@/hooks/useCloseOnGoBack";
import { useVisibleWhenUnlocked } from "@/hooks/useVisibleWhenUnlocked";
import { PILL_RADIUS, SHEET_RADIUS, TRANSITION } from "@/lib/design";

// TDS 바텀시트와 BottomSheet.Select에서 잰 값이다.
const SHEET_MARGIN = 10;
const HANDLE_AREA_HEIGHT = 16;
const HANDLE_WIDTH = 48;
const HANDLE_HEIGHT = 4;
const LIST_PADDING_TOP = 8;
const LIST_PADDING_BOTTOM = 16;
const ROW_PADDING_X = 24;
const ROW_PADDING_Y = 16;
const ROW_RADIUS = 12;
const ROW_PRESSED_SCALE = 0.96;

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
  open: requested,
  onOpenChange,
  items,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: MenuSheetItem[];
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const open = useVisibleWhenUnlocked(requested);

  // 키보드가 올라와 있으면 시트를 덮는다. 둘은 같이 떠 있을 수 없다.
  useEffect(() => {
    if (open) {
      Keyboard.dismiss();
    }
  }, [open]);

  useCloseOnGoBack(open, () => onOpenChange(false));

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPointsMode="fit"
      dismissOnSnapToBottom
      transition={TRANSITION}
    >
      <Sheet.Overlay
        bg="$dimmedBackground"
        transition={TRANSITION}
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />

      <Sheet.Frame
        bg="transparent"
        px={SHEET_MARGIN}
        // TDS는 안전영역이 있으면 여백을 더하지 않고 그 높이만큼만 띄운다.
        pb={insets.bottom || SHEET_MARGIN}
      >
        <YStack bg="$layeredBackground" rounded={SHEET_RADIUS}>
          <YStack height={HANDLE_AREA_HEIGHT} items="center" justify="flex-end">
            <YStack
              width={HANDLE_WIDTH}
              height={HANDLE_HEIGHT}
              rounded={PILL_RADIUS}
              bg="$grey200"
            />
          </YStack>

          <YStack pt={LIST_PADDING_TOP} pb={LIST_PADDING_BOTTOM}>
            {items.map(({ label, destructive, selected, onPress }) => (
              <XStack
                key={label}
                items="center"
                px={ROW_PADDING_X}
                py={ROW_PADDING_Y}
                rounded={ROW_RADIUS}
                pressStyle={{ bg: "$greyOpacity100", scale: ROW_PRESSED_SCALE }}
                transition={TRANSITION}
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
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
