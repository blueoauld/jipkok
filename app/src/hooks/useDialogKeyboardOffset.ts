import { useKeyboardState } from "react-native-keyboard-controller";

export function useDialogKeyboardOffset() {
  const height = useKeyboardState((state) => state.height);

  return -height / 2;
}
