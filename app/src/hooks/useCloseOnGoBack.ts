import { useEffect, useRef } from "react";
import { BackHandler } from "react-native";

// 시트와 다이얼로그는 Modal이 아니라 루트 포털로 그려지므로 안드로이드 뒤로가기가 이들을
// 지나쳐 아래 네비게이터로 간다. 떠 있는 동안은 먼저 받아 스스로 닫는다.
export function useCloseOnGoBack(active: boolean, close: () => void) {
  const closeRef = useRef(close);

  useEffect(() => {
    closeRef.current = close;
  }, [close]);

  useEffect(() => {
    if (!active) {
      return;
    }

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        closeRef.current();
        return true;
      },
    );

    return () => subscription.remove();
  }, [active]);
}
