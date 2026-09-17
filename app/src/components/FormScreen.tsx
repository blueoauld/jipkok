import {
  type ComponentProps,
  type ReactNode,
  useCallback,
  useState,
} from "react";
import type { LayoutChangeEvent } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";

import { BottomCTAFade } from "@/components/ui/BottomCTAFade";
import {
  BOTTOM_CTA_FADE_HEIGHT,
  BOTTOM_CTA_PADDING_BOTTOM,
  FORM_FOOTER_HEIGHT,
  KEYBOARD_OVERLAP,
  SCREEN_PADDING,
} from "@/lib/design";

type ScrollMode = ComponentProps<typeof KeyboardAwareScrollView>["mode"];

export function FormScreen({
  scrollMode,
  footer,
  children,
}: {
  scrollMode?: ScrollMode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const [footerHeight, setFooterHeight] = useState(FORM_FOOTER_HEIGHT);
  // 화면은 SafeAreaView가 이미 안전영역만큼 띄워 둔다. 버튼 아래는 TDS처럼 안전영역과 아래 여백 중
  // 큰 값이어야 하므로, 겹치는 만큼 하단 영역을 안전영역 안으로 내린다.
  const safeAreaOverlap = Math.min(insets.bottom, BOTTOM_CTA_PADDING_BOTTOM);

  const measureFooter = useCallback(
    (event: LayoutChangeEvent) =>
      setFooterHeight(event.nativeEvent.layout.height),
    [],
  );

  return (
    <>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        mode={scrollMode}
        bottomOffset={footerHeight + BOTTOM_CTA_FADE_HEIGHT}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <YStack
          gap="$4"
          p={SCREEN_PADDING}
          pb={footerHeight + BOTTOM_CTA_FADE_HEIGHT}
        >
          {children}
        </YStack>
      </KeyboardAwareScrollView>

      <KeyboardStickyView
        offset={{ closed: 0, opened: insets.bottom - safeAreaOverlap }}
      >
        <YStack
          px={SCREEN_PADDING}
          pb={BOTTOM_CTA_PADDING_BOTTOM + KEYBOARD_OVERLAP}
          mb={-(safeAreaOverlap + KEYBOARD_OVERLAP)}
          bg="$background"
          onLayout={measureFooter}
        >
          <BottomCTAFade />

          {footer}
        </YStack>
      </KeyboardStickyView>
    </>
  );
}
