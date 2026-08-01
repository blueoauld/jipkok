import { useEffect } from "react";
import { BackHandler } from "react-native";

export function useBlockGoBack() {
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true,
    );

    return () => subscription.remove();
  }, []);
}
