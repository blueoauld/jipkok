import { type ReactNode, useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sheet, Text, XStack, YStack } from "tamagui";

import { useCloseOnGoBack } from "@/hooks/useCloseOnGoBack";
import { useVisibleWhenUnlocked } from "@/hooks/useVisibleWhenUnlocked";
import {
  PILL_RADIUS,
  SCREEN_PADDING,
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

// TDS 바텀시트의 두 버튼(BottomSheet.DoubleCTA)에서 잰 값이다.
const CTA_PADDING_TOP = 36;
const CTA_PADDING_BOTTOM = 20;
const CTA_GAP = 8;

// Tamagui가 시트를 올릴 때 쓰는 것과 같은 키보드 이벤트로 키보드가 떠 있는지 본다.
function useKeyboardVisible(enabled: boolean) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const ios = Platform.OS === "ios";
    const show = Keyboard.addListener(
      ios ? "keyboardWillShow" : "keyboardDidShow",
      () => setVisible(true),
    );
    const hide = Keyboard.addListener(
      ios ? "keyboardWillHide" : "keyboardDidHide",
      () => setVisible(false),
    );

    return () => {
      show.remove();
      hide.remove();
    };
  }, [enabled]);

  return visible;
}

// 키보드 위에는 좌우 여백만큼만 띄운다. 시트는 키보드 이벤트의 높이만큼 올라가는데, 그 높이가
// iOS는 아래 안전영역을 품고 안드로이드는 아래 시스템 바를 빼고 오므로 안드로이드만 그만큼 더한다.
function keyboardPadding(bottomInset: number) {
  return Platform.OS === "android" ? bottomInset + SHEET_MARGIN : SHEET_MARGIN;
}

// dismissible이 거짓이면 끌어내리거나 뒤를 눌러도 닫히지 않는다. 입력칸이 있는 시트는
// moveOnKeyboardChange로 키보드 위로 올린다.
export function BottomSheet({
  open: requested,
  onOpenChange,
  title,
  dismissible = true,
  moveOnKeyboardChange = false,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  dismissible?: boolean;
  moveOnKeyboardChange?: boolean;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const open = useVisibleWhenUnlocked(requested);
  const keyboardVisible = useKeyboardVisible(moveOnKeyboardChange);
  // 키보드가 없으면 TDS처럼 안전영역이 있을 때 여백을 더하지 않고 그 높이만큼만 띄운다.
  const bottomPadding = keyboardVisible
    ? keyboardPadding(insets.bottom)
    : insets.bottom || SHEET_MARGIN;

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
      dismissOnSnapToBottom={dismissible}
      dismissOnOverlayPress={dismissible}
      disableDrag={!dismissible}
      moveOnKeyboardChange={moveOnKeyboardChange}
      transition={TRANSITION}
    >
      <Sheet.Overlay
        bg="$dimmedBackground"
        transition={TRANSITION}
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />

      <Sheet.Frame bg="transparent" px={SHEET_MARGIN} pb={bottomPadding}>
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

// 시트 맨 아래에 두 버튼을 나란히 둔다.
export function BottomSheetButtons({ children }: { children: ReactNode }) {
  return (
    <XStack
      gap={CTA_GAP}
      px={SCREEN_PADDING}
      pt={CTA_PADDING_TOP}
      pb={CTA_PADDING_BOTTOM}
    >
      {children}
    </XStack>
  );
}
