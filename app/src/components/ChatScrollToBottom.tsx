import { CaretDownIcon } from "phosphor-react-native/src/icons/CaretDown";
import { useCallback, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { getTokens, XStack } from "tamagui";

import { SCROLL_TO_TOP_BOTTOM_GAP } from "@/components/ScrollToTopButton";
import { RetroCard } from "@/components/ui/RetroCard";
import { FLOATING_BUTTON_SIZE } from "@/lib/design";

const ICON_SIZE = 20;

const SHOW_OFFSET = 200;

export function useScrollToBottomVisible() {
  const [visible, setVisible] = useState(false);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setVisible(event.nativeEvent.contentOffset.y > SHOW_OFFSET);
    },
    [],
  );

  return { visible, onScroll };
}

export function ChatScrollToBottom({
  visible,
  onPress,
}: {
  visible: boolean;
  onPress: () => void;
}) {
  if (!visible) {
    return null;
  }

  return (
    <XStack
      position="absolute"
      r={getTokens().space.$3.val}
      b={SCROLL_TO_TOP_BOTTOM_GAP}
    >
      <RetroCard
        theme="purple"
        shadow="$gray12"
        bg="$color10"
        pressBg="$color11"
        p={0}
        width={FLOATING_BUTTON_SIZE}
        height={FLOATING_BUTTON_SIZE}
        items="center"
        justify="center"
        onPress={onPress}
      >
        <CaretDownIcon size={ICON_SIZE} weight="bold" color="white" />
      </RetroCard>
    </XStack>
  );
}
