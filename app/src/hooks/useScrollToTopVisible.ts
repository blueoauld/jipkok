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

  // 목록을 갈아 끼우면 새 목록은 맨 위에서 시작하므로 버튼도 숨긴다.
  const reset = useCallback(() => setVisible(false), []);

  return { visible, onScroll, reset };
}
