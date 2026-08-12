import { useCallback, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

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
