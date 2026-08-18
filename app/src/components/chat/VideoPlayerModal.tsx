import { useVideoPlayer, VideoView } from "expo-video";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack } from "tamagui";

import { PRESS_OPACITY } from "@/lib/design";

const CLOSE_ICON_SIZE = 28;
const CLOSE_INSET = 12;

function Player({ url, onClose }: { url: string; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const player = useVideoPlayer(url, (instance) => {
    instance.play();
  });

  return (
    <YStack flex={1} bg="black">
      <VideoView
        player={player}
        style={{ flex: 1 }}
        contentFit="contain"
        nativeControls
        allowsPictureInPicture={false}
      />

      <XStack
        position="absolute"
        t={insets.top + CLOSE_INSET}
        r={CLOSE_INSET}
        p="$2"
        pressStyle={{ opacity: PRESS_OPACITY }}
        onPress={onClose}
      >
        <XIcon size={CLOSE_ICON_SIZE} weight="bold" color="white" />
      </XStack>
    </YStack>
  );
}

// url이 있을 때만 플레이어를 만든다. 닫으면 플레이어도 함께 버려진다.
export function VideoPlayerModal({
  url,
  onClose,
}: {
  url: string | null;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={url !== null}
      animationType="fade"
      supportedOrientations={["portrait", "landscape"]}
      onRequestClose={onClose}
    >
      {url && <Player url={url} onClose={onClose} />}
    </Modal>
  );
}
