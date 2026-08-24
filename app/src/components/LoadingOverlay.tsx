import { StyleSheet } from "react-native";
import { Spinner, Text, YStack } from "tamagui";

import { OVERLAY_BG } from "@/lib/design";
import { useLoadingOverlayStore } from "@/lib/overlay/store";

export function LoadingOverlay() {
  const visible = useLoadingOverlayStore((state) => state.visible);
  const progress = useLoadingOverlayStore((state) => state.progress);

  if (!visible) {
    return null;
  }

  return (
    <YStack
      style={StyleSheet.absoluteFill}
      bg={OVERLAY_BG}
      items="center"
      justify="center"
      gap="$3"
    >
      <Spinner size="small" color="white" />

      {progress ? (
        <Text color="white" fontSize="$3" fontWeight="700">
          {progress.done} / {progress.total}
        </Text>
      ) : null}
    </YStack>
  );
}
