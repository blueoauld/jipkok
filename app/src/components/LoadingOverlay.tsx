import { StyleSheet } from "react-native";
import { Spinner, YStack } from "tamagui";

import { OVERLAY_BG } from "@/lib/design";
import { useLoadingOverlayStore } from "@/lib/overlay/store";

export function LoadingOverlay() {
  const visible = useLoadingOverlayStore((state) => state.visible);

  if (!visible) {
    return null;
  }

  return (
    <YStack
      style={StyleSheet.absoluteFill}
      bg={OVERLAY_BG}
      items="center"
      justify="center"
    >
      <Spinner size="small" color="white" />
    </YStack>
  );
}
