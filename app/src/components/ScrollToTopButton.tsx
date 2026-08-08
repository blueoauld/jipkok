import { CaretUpIcon } from "phosphor-react-native/src/icons/CaretUp";
import { useCallback, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, XStack } from "tamagui";

import { PRESS_OPACITY, tabBarOverlayHeight } from "@/lib/design";

import { GlassSurface } from "./GlassSurface";

const BUTTON_SIZE = 40;
const ICON_SIZE = 20;
const BUTTON_GAP = 16;

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
  const theme = useTheme();
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
      <GlassSurface
        style={{
          borderRadius: 9999,
          overflow: "hidden",
        }}
      >
        <XStack
          width={BUTTON_SIZE}
          height={BUTTON_SIZE}
          rounded={9999}
          borderWidth={StyleSheet.hairlineWidth}
          borderColor="$borderColor"
          items="center"
          justify="center"
          pressStyle={{ opacity: PRESS_OPACITY }}
          onPress={onPress}
        >
          <CaretUpIcon
            size={ICON_SIZE}
            weight="bold"
            color={theme.color10.val}
          />
        </XStack>
      </GlassSurface>
    </XStack>
  );
}
