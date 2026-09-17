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
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useTheme, YStack } from "tamagui";

import {
  FORM_FOOTER_HEIGHT,
  KEYBOARD_OVERLAP,
  SCREEN_PADDING,
} from "@/lib/design";

// TDS 하단 고정 버튼(BottomCTA)에서 잰 값이다. 버튼 위 띠는 아래 25%까지 배경색이고 위로 투명해진다.
const FADE_HEIGHT = 36;
const FADE_SOLID_STOP = 0.25;
const FADE_ID = "form-footer-fade";
const BOTTOM_PADDING = 20;

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
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [footerHeight, setFooterHeight] = useState(FORM_FOOTER_HEIGHT);
  // 화면은 SafeAreaView가 이미 안전영역만큼 띄워 둔다. 버튼 아래는 TDS처럼 안전영역과 아래 여백 중
  // 큰 값이어야 하므로, 겹치는 만큼 하단 영역을 안전영역 안으로 내린다.
  const safeAreaOverlap = Math.min(insets.bottom, BOTTOM_PADDING);

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
        bottomOffset={footerHeight + FADE_HEIGHT}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <YStack gap="$4" p={SCREEN_PADDING} pb={footerHeight + FADE_HEIGHT}>
          {children}
        </YStack>
      </KeyboardAwareScrollView>

      <KeyboardStickyView
        offset={{ closed: 0, opened: insets.bottom - safeAreaOverlap }}
      >
        <YStack
          px={SCREEN_PADDING}
          pb={BOTTOM_PADDING + KEYBOARD_OVERLAP}
          mb={-(safeAreaOverlap + KEYBOARD_OVERLAP)}
          bg="$background"
          onLayout={measureFooter}
        >
          <YStack
            position="absolute"
            t={-FADE_HEIGHT}
            l={0}
            r={0}
            height={FADE_HEIGHT}
            pointerEvents="none"
          >
            <Svg width="100%" height="100%">
              <Defs>
                <LinearGradient id={FADE_ID} x1="0" y1="1" x2="0" y2="0">
                  <Stop
                    offset={FADE_SOLID_STOP}
                    stopColor={theme.background.val}
                    stopOpacity={1}
                  />
                  <Stop
                    offset={1}
                    stopColor={theme.background.val}
                    stopOpacity={0}
                  />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill={`url(#${FADE_ID})`} />
            </Svg>
          </YStack>

          {footer}
        </YStack>
      </KeyboardStickyView>
    </>
  );
}
