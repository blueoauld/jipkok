import { CaretUpIcon } from "phosphor-react-native/src/icons/CaretUp";
import { useCallback, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { XStack } from "tamagui";

import { RetroCard } from "@/components/ui/RetroCard";
import { FLOATING_BUTTON_SIZE } from "@/lib/design";

const ICON_SIZE = 20;

export const SCROLL_TO_TOP_BOTTOM_GAP = 12;

const SHOW_OFFSET = 600;

export const SCROLL_EVENT_THROTTLE = 100;

export function useScrollToTopVisible() {
  const [visible, setVisible] = useState(false);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setVisible(event.nativeEvent.contentOffset.y > SHOW_OFFSET);
    },
    [],
  );

  return { visible, onScroll };
}

export function ScrollToTopButton({
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
      r={SCROLL_TO_TOP_BOTTOM_GAP}
      b={SCROLL_TO_TOP_BOTTOM_GAP}
    >
      <RetroCard
        theme="blue"
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
        <CaretUpIcon size={ICON_SIZE} weight="bold" color="white" />
      </RetroCard>
    </XStack>
  );
}
