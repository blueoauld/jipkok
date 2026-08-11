import { CaretDownIcon } from "phosphor-react-native/src/icons/CaretDown";
import type { ViewStyle } from "react-native";
import { getTokens, XStack, YStack } from "tamagui";

import { SCROLL_TO_TOP_BOTTOM_GAP } from "@/components/ScrollToTopButton";
import { FLOATING_BUTTON_SIZE, RETRO_SHADOW_OFFSET } from "@/lib/design";

const ICON_SIZE = 20;

export const CHAT_SCROLL_TO_BOTTOM_STYLE: ViewStyle = {
  right: getTokens().space.$3.val,
  bottom: SCROLL_TO_TOP_BOTTOM_GAP,
};

export const CHAT_SCROLL_TO_BOTTOM_CONTENT_STYLE: ViewStyle = {
  width: FLOATING_BUTTON_SIZE,
  height: FLOATING_BUTTON_SIZE,
  borderRadius: 0,
  backgroundColor: "transparent",
  elevation: 0,
  shadowOpacity: 0,
};

export function ChatScrollToBottom({ onPress }: { onPress: () => void }) {
  return (
    <YStack theme="purple">
      <YStack
        position="absolute"
        t={RETRO_SHADOW_OFFSET}
        b={-RETRO_SHADOW_OFFSET}
        l={RETRO_SHADOW_OFFSET}
        r={-RETRO_SHADOW_OFFSET}
        bg="$gray12"
      />
      <XStack
        width={FLOATING_BUTTON_SIZE}
        height={FLOATING_BUTTON_SIZE}
        borderWidth={2}
        borderColor="$gray12"
        bg="$color10"
        items="center"
        justify="center"
        pressStyle={{
          x: RETRO_SHADOW_OFFSET,
          y: RETRO_SHADOW_OFFSET,
          bg: "$color11",
        }}
        onPress={onPress}
      >
        <CaretDownIcon size={ICON_SIZE} weight="bold" color="white" />
      </XStack>
    </YStack>
  );
}
