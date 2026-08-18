import { useEvent, useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { PauseIcon } from "phosphor-react-native/src/icons/Pause";
import { PlayIcon } from "phosphor-react-native/src/icons/Play";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type LayoutChangeEvent,
  Modal,
  Pressable,
  StatusBar,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Text, XStack, YStack } from "tamagui";

import { OVERLAY_BG, PRESS_OPACITY, RETRO_BORDER_WIDTH } from "@/lib/design";
import { formatDuration } from "@/lib/video";

const CLOSE_BUTTON_SIZE = 40;
const CLOSE_ICON_SIZE = 24;
const PLAY_BUTTON_SIZE = 64;
const PLAY_ICON_SIZE = 30;

const TRACK_HEIGHT = 4;
const THUMB_SIZE = 16;
const TRACK_HIT_SLOP = 12;

const TIME_UPDATE_INTERVAL = 0.25;
const AUTO_HIDE_MILLIS = 3000;

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

function SeekBar({
  position,
  duration,
  onSeek,
}: {
  position: number;
  duration: number;
  onSeek: (seconds: number) => void;
}) {
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState<number | null>(null);

  const onLayout = (event: LayoutChangeEvent) =>
    setWidth(event.nativeEvent.layout.width);

  const ratioOf = (x: number) => (width > 0 ? clamp(x / width) : 0);

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((event) => setDragging(ratioOf(event.x)))
    .onUpdate((event) => setDragging(ratioOf(event.x)))
    .onFinalize((event, success) => {
      if (success) {
        onSeek(ratioOf(event.x) * duration);
      }

      setDragging(null);
    })
    .runOnJS(true);

  const ratio = dragging ?? (duration > 0 ? clamp(position / duration) : 0);
  const shown = dragging === null ? position : dragging * duration;

  return (
    <XStack items="center" gap="$3">
      <Text fontSize="$2" color="white" fontWeight="600">
        {formatDuration(Math.floor(shown))}
      </Text>

      <GestureDetector gesture={pan}>
        <YStack
          flex={1}
          py={TRACK_HIT_SLOP}
          justify="center"
          onLayout={onLayout}
        >
          <YStack height={TRACK_HEIGHT} bg="rgba(255, 255, 255, 0.35)">
            <YStack height={TRACK_HEIGHT} width={width * ratio} bg="white" />
          </YStack>

          <YStack
            position="absolute"
            l={width * ratio - THUMB_SIZE / 2}
            width={THUMB_SIZE}
            height={THUMB_SIZE}
            bg="white"
            borderWidth={RETRO_BORDER_WIDTH}
            borderColor="$gray12"
          />
        </YStack>
      </GestureDetector>

      <Text fontSize="$2" color="white" fontWeight="600">
        {formatDuration(Math.floor(duration))}
      </Text>
    </XStack>
  );
}

function Player({ url, onClose }: { url: string; onClose: () => void }) {
  const player = useVideoPlayer(url, (instance) => {
    instance.timeUpdateEventInterval = TIME_UPDATE_INTERVAL;
    instance.play();
  });
  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });
  const currentTime = useEvent(player, "timeUpdate")?.currentTime ?? 0;
  const [ended, setEnded] = useState(false);
  const [visible, setVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHide = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHide();
    hideTimer.current = setTimeout(() => setVisible(false), AUTO_HIDE_MILLIS);
  }, [clearHide]);

  useEventListener(player, "playToEnd", () => {
    setEnded(true);
    setVisible(true);
  });

  // 재생 중일 때만 컨트롤을 숨긴다. 멈춰 있으면 계속 보여 준다.
  useEffect(() => {
    if (isPlaying) {
      scheduleHide();
    } else {
      clearHide();
    }

    return clearHide;
  }, [clearHide, isPlaying, scheduleHide]);

  const showControls = () => {
    setVisible(true);

    if (isPlaying) {
      scheduleHide();
    }
  };

  const togglePlay = () => {
    if (ended) {
      player.currentTime = 0;
      setEnded(false);
      player.play();
    } else if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }

    showControls();
  };

  const seek = (seconds: number) => {
    player.currentTime = seconds;
    setEnded(false);
    showControls();
  };

  return (
    <SafeAreaProvider>
      <YStack flex={1} bg="black">
        <StatusBar barStyle="light-content" />

        <VideoView
          player={player}
          style={{ flex: 1 }}
          contentFit="contain"
          nativeControls={false}
          allowsPictureInPicture={false}
        />

        <Pressable
          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
          onPress={() => (visible ? setVisible(false) : showControls())}
        />

        {visible && (
          <>
            <SafeAreaView
              edges={["top"]}
              style={{ position: "absolute", top: 0, left: 0, right: 0 }}
            >
              <XStack p="$2">
                <XStack
                  width={CLOSE_BUTTON_SIZE}
                  height={CLOSE_BUTTON_SIZE}
                  items="center"
                  justify="center"
                  pressStyle={{ opacity: PRESS_OPACITY }}
                  onPress={onClose}
                >
                  <XIcon size={CLOSE_ICON_SIZE} weight="bold" color="white" />
                </XStack>
              </XStack>
            </SafeAreaView>

            <YStack
              position="absolute"
              t={0}
              r={0}
              b={0}
              l={0}
              items="center"
              justify="center"
              pointerEvents="box-none"
            >
              <XStack
                width={PLAY_BUTTON_SIZE}
                height={PLAY_BUTTON_SIZE}
                items="center"
                justify="center"
                bg={OVERLAY_BG}
                borderWidth={RETRO_BORDER_WIDTH}
                borderColor="white"
                pressStyle={{ opacity: PRESS_OPACITY }}
                onPress={togglePlay}
              >
                {isPlaying && !ended ? (
                  <PauseIcon
                    size={PLAY_ICON_SIZE}
                    weight="fill"
                    color="white"
                  />
                ) : (
                  <PlayIcon size={PLAY_ICON_SIZE} weight="fill" color="white" />
                )}
              </XStack>
            </YStack>

            <SafeAreaView
              edges={["bottom"]}
              style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
            >
              <YStack px="$4" py="$3" bg={OVERLAY_BG}>
                <SeekBar
                  position={currentTime}
                  duration={player.duration}
                  onSeek={seek}
                />
              </YStack>
            </SafeAreaView>
          </>
        )}
      </YStack>
    </SafeAreaProvider>
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
