import { type ReactNode, useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";
import { Sheet, XStack, YStack } from "tamagui";

import { Text } from "@/components/ui/Text";
import { useCloseOnGoBack } from "@/hooks/useCloseOnGoBack";
import { useVisibleWhenUnlocked } from "@/hooks/useVisibleWhenUnlocked";
import { useWindowInsets } from "@/hooks/useWindowInsets";
import {
  CONTENT_MAX_WIDTH,
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

// 시트 아래 여백이다. 안드로이드 시스템 바는 불투명한 띠라 그 위에 딱 붙으면 시트가 바에 얹힌 것처럼
// 보이므로 바 높이에 좌우와 같은 여백을 더한다. 시트를 키보드 높이만큼 올릴 때도 그 높이에는 시스템 바가
// 빠져 있어 같은 값을 쓴다. iOS는 홈 인디케이터가 앱 배경 위에 떠 있어 TDS처럼 그 높이만큼만 띄우고,
// 키보드 높이에는 안전영역이 들어 있어 좌우 여백만 둔다.
function bottomPaddingOf(bottomInset: number, keyboardVisible: boolean) {
  if (Platform.OS === "android") {
    return bottomInset + SHEET_MARGIN;
  }

  return keyboardVisible ? SHEET_MARGIN : bottomInset || SHEET_MARGIN;
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
  const insets = useWindowInsets();
  const open = useVisibleWhenUnlocked(requested);
  const keyboardVisible = useKeyboardVisible(moveOnKeyboardChange);
  const bottomPadding = bottomPaddingOf(insets.bottom, keyboardVisible);

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
        <YStack
          width="100%"
          maxW={CONTENT_MAX_WIDTH}
          self="center"
          bg="$layeredBackground"
          rounded={SHEET_RADIUS}
        >
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
              preset="title"
              px={SHEET_PADDING_X}
              pt={HEADER_PADDING_TOP}
              pb={HEADER_PADDING_BOTTOM}
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
