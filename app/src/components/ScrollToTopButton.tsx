import { CaretUpIcon } from "phosphor-react-native/src/icons/CaretUp";
import { useCallback, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack } from "tamagui";

import { RetroCard } from "@/components/ui/RetroCard";
import { tabBarOverlayHeight } from "@/lib/design";

const BUTTON_SIZE = 40;
const ICON_SIZE = 20;
const BUTTON_GAP = 12;

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
  const insets = useSafeAreaInsets();

  if (!visible) {
    return null;
  }

  return (
    <XStack
      position="absolute"
      r={BUTTON_GAP}
      b={tabBarOverlayHeight(insets.bottom) + BUTTON_GAP}
    >
      <RetroCard
        theme="blue"
        bg="$color10"
        p={0}
        width={BUTTON_SIZE}
        height={BUTTON_SIZE}
        items="center"
        justify="center"
        onPress={onPress}
      >
        <CaretUpIcon size={ICON_SIZE} weight="bold" color="white" />
      </RetroCard>
    </XStack>
  );
}
