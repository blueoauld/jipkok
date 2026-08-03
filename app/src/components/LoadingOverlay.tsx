import { StyleSheet } from "react-native";
import { Spinner, YStack } from "tamagui";

import { useLoadingOverlayStore } from "@/lib/overlay/store";

const OVERLAY_OPACITY = 0.6;

export function LoadingOverlay() {
  const visible = useLoadingOverlayStore((state) => state.visible);

  if (!visible) {
    return null;
  }

  return (
    <YStack style={StyleSheet.absoluteFill} items="center" justify="center">
      <YStack
        style={StyleSheet.absoluteFill}
        bg="$background"
        opacity={OVERLAY_OPACITY}
      />

      <Spinner size="small" />
    </YStack>
  );
}
