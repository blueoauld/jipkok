import { Modal } from "react-native";
import { Spinner, YStack } from "tamagui";

const OVERLAY_OPACITY = 0.6;

export function LoadingOverlay({ visible }: { visible: boolean }) {
  return (
    <Modal
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      visible={visible}
      animationType="fade"
      onRequestClose={() => {}}
    >
      <YStack flex={1} items="center" justify="center">
        <YStack
          position="absolute"
          t={0}
          l={0}
          r={0}
          b={0}
          bg="$background"
          opacity={OVERLAY_OPACITY}
        />

        <Spinner size="small" />
      </YStack>
    </Modal>
  );
}
