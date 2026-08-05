import { StyleSheet } from "react-native";
import { Spinner, YStack } from "tamagui";

import { SHEET_OVERLAY_OPACITY } from "@/lib/design";
import { useLoadingOverlayStore } from "@/lib/overlay/store";

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
        opacity={SHEET_OVERLAY_OPACITY}
      />

      <Spinner size="small" />
    </YStack>
  );
}
