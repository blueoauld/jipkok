import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatePresence, getTokens, Text, XStack, YStack } from "tamagui";

import { RetroShadow } from "@/components/ui/RetroShadow";
import {
  bottomBarHeight,
  RETRO_BORDER_WIDTH,
  RETRO_SHADOW_OFFSET,
} from "@/lib/design";
import { useToastStore } from "@/lib/toast/store";

const VISIBLE_DURATION = 2500;
const SIDE_GAP = 12;
const SLIDE_OFFSET = 12;
const ACCENT_BAR_WIDTH = 8;
const TEXT_PADDING_Y = getTokens().space.$3.val + RETRO_BORDER_WIDTH;

const ACCENT_BAR_COLORS = {
  info: "$blue9",
  warning: "$yellow9",
  error: "$red9",
} as const;

export function ToastHost() {
  const toast = useToastStore((state) => state.toast);
  const hide = useToastStore((state) => state.hide);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = setTimeout(hide, VISIBLE_DURATION);

    return () => clearTimeout(timer);
  }, [toast, hide]);

  return (
    <YStack
      position="absolute"
      l={SIDE_GAP}
      r={SIDE_GAP}
      b={bottomBarHeight(insets.bottom) + SIDE_GAP}
      pr={RETRO_SHADOW_OFFSET}
      pb={RETRO_SHADOW_OFFSET}
      pointerEvents="box-none"
    >
      <AnimatePresence>
        {toast && (
          <YStack
            key={toast.id}
            opacity={1}
            y={0}
            transition="quick"
            enterStyle={{ opacity: 0, y: SLIDE_OFFSET }}
            exitStyle={{ opacity: 0, y: SLIDE_OFFSET }}
          >
            <YStack theme="gray">
              <RetroShadow color="$gray12" />

              <XStack
                bg="$color1"
                onPress={hide}
                pressStyle={{
                  x: RETRO_SHADOW_OFFSET,
                  y: RETRO_SHADOW_OFFSET,
                  bg: "$color3",
                }}
              >
                <YStack
                  width={ACCENT_BAR_WIDTH + RETRO_BORDER_WIDTH}
                  bg={ACCENT_BAR_COLORS[toast.variant]}
                />

                <Text
                  flex={1}
                  px="$3"
                  py={TEXT_PADDING_Y}
                  fontSize="$3"
                  color="$color12"
                >
                  {toast.message}
                </Text>

                <YStack
                  fullscreen
                  borderWidth={RETRO_BORDER_WIDTH}
                  borderColor="$gray12"
                  pointerEvents="none"
                />
              </XStack>
            </YStack>
          </YStack>
        )}
      </AnimatePresence>
    </YStack>
  );
}
