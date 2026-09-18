import { StyleSheet } from "react-native";
import { Spinner, YStack } from "tamagui";

import { Text } from "@/components/ui/Text";
import { OVERLAY_BG, OVERLAY_INK } from "@/lib/design";
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
      <Spinner size="small" color={OVERLAY_INK} />

      {progress ? (
        <Text color={OVERLAY_INK} fontSize="$4" fontWeight="700">
          {progress.done} / {progress.total}
        </Text>
      ) : null}
    </YStack>
  );
}
