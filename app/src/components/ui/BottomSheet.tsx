import { type ReactNode, useEffect } from "react";
import { Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sheet, Text, YStack } from "tamagui";

import { useCloseOnGoBack } from "@/hooks/useCloseOnGoBack";
import { useVisibleWhenUnlocked } from "@/hooks/useVisibleWhenUnlocked";
import {
  PILL_RADIUS,
  SHEET_PADDING_X,
  SHEET_RADIUS,
  TRANSITION,
} from "@/lib/design";

// TDS 바텀시트에서 잰 값이다.
const SHEET_MARGIN = 10;
const HANDLE_AREA_HEIGHT = 16;
const HANDLE_WIDTH = 48;
const HANDLE_HEIGHT = 4;
const HEADER_PADDING_TOP = 25;
const HEADER_PADDING_BOTTOM = 13;

export function BottomSheet({
  open: requested,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: ReactNode;
}) {
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

          {title !== undefined && (
            <Text
              px={SHEET_PADDING_X}
              pt={HEADER_PADDING_TOP}
              pb={HEADER_PADDING_BOTTOM}
              fontSize="$6"
              lineHeight="$6"
              fontWeight="700"
              color="$grey900"
            >
              {title}
            </Text>
          )}

          {children}
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
