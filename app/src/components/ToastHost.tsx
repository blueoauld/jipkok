import { useEffect } from "react";
import { AccessibilityInfo } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import Svg, { Circle, Path } from "react-native-svg";
import { AnimatePresence, Text, useTheme, XStack, YStack } from "tamagui";

import { useBottomBarHeight } from "@/hooks/useBottomBar";
import {
  PILL_RADIUS,
  PRESS_OPACITY,
  SCREEN_PADDING,
  TRANSITION,
} from "@/lib/design";
import { useToastStore } from "@/lib/toast/store";

const VISIBLE_DURATION = 3000;
const SLIDE_OFFSET = 12;

// TDS 하단 토스트에서 잰 값이다.
const BOTTOM_GAP = 20;
const PADDING_Y = 14;
const PADDING_LEFT = 16;
const PADDING_RIGHT = 20;
const ICON_SIZE = 24;
const ICON_GAP = 8;

// 체크는 TDS 토스트 아이콘을 옮겼고 느낌표는 같은 원과 선 두께에 맞춰 그렸다.
// 24칸에 반지름 10.5인 색 원을 채우고 안쪽 모양은 흰 선으로 그린다.
const ICON_RADIUS = 10.5;
const GLYPH_STROKE = 1.6;
const CHECK_PATH = "M7.97 11.77l3.06 3.06 5-5";
const EXCLAMATION_PATH = "M12 7v5.6";
const EXCLAMATION_DOT_Y = 16.2;
const EXCLAMATION_DOT_RADIUS = 1;

const ICONS = {
  info: { color: "green400", glyph: "check" },
  warning: { color: "yellow500", glyph: "exclamation" },
  error: { color: "red500", glyph: "exclamation" },
} as const;

function ToastIcon({ icon }: { icon: (typeof ICONS)[keyof typeof ICONS] }) {
  const theme = useTheme();
  const ink = theme.onFill.val;

  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={ICON_RADIUS} fill={theme[icon.color].val} />

      {icon.glyph === "check" ? (
        <Path
          d={CHECK_PATH}
          fill="none"
          stroke={ink}
          strokeWidth={GLYPH_STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <>
          <Path
            d={EXCLAMATION_PATH}
            stroke={ink}
            strokeWidth={GLYPH_STROKE}
            strokeLinecap="round"
          />
          <Circle
            cx={12}
            cy={EXCLAMATION_DOT_Y}
            r={EXCLAMATION_DOT_RADIUS}
            fill={ink}
          />
        </>
      )}
    </Svg>
  );
}

export function ToastHost() {
  const toast = useToastStore((state) => state.toast);
  const hide = useToastStore((state) => state.hide);
  const barHeight = useBottomBarHeight();

  useEffect(() => {
    if (!toast) {
      return;
    }

    AccessibilityInfo.announceForAccessibility(toast.message);

    const timer = setTimeout(hide, VISIBLE_DURATION);

    return () => clearTimeout(timer);
  }, [toast, hide]);

  return (
    <YStack
      position="absolute"
      l={SCREEN_PADDING}
      r={SCREEN_PADDING}
      b={barHeight + BOTTOM_GAP}
      items="center"
      pointerEvents="box-none"
    >
      <KeyboardStickyView offset={{ closed: 0, opened: barHeight }}>
        <AnimatePresence>
          {toast && (
            <XStack
              key={toast.id}
              items="center"
              gap={ICON_GAP}
              pl={PADDING_LEFT}
              pr={PADDING_RIGHT}
              py={PADDING_Y}
              rounded={PILL_RADIUS}
              bg="$grey500"
              opacity={1}
              y={0}
              transition={TRANSITION}
              enterStyle={{ opacity: 0, y: SLIDE_OFFSET }}
              exitStyle={{ opacity: 0, y: SLIDE_OFFSET }}
              pressStyle={{ opacity: PRESS_OPACITY }}
              onPress={hide}
            >
              <ToastIcon icon={ICONS[toast.variant]} />

              <Text shrink={1} fontSize="$2" fontWeight="600" color="$onFill">
                {toast.message}
              </Text>
            </XStack>
          )}
        </AnimatePresence>
      </KeyboardStickyView>
    </YStack>
  );
}
