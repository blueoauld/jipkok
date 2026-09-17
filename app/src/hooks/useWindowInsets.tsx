import { createContext, type ReactNode, useContext } from "react";
import {
  type EdgeInsets,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const WindowInsetsContext = createContext<EdgeInsets | null>(null);

// 앱 맨 위에서 잰 창의 안전영역을 내려보낸다. iOS 시스템 탭은 탭마다 안전영역을 새로 재서 아래 값에 탭 바가
// 들어가므로, 창 위에 뜨는 시트나 탭 바를 숨긴 채 바닥에 붙는 줄은 탭 안에서도 이 값을 써야 한다.
export function WindowInsetsProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <WindowInsetsContext.Provider value={insets}>
      {children}
    </WindowInsetsContext.Provider>
  );
}

export function useWindowInsets() {
  const rootInsets = useContext(WindowInsetsContext);
  const localInsets = useSafeAreaInsets();

  return rootInsets ?? localInsets;
}
