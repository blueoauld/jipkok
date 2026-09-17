import { useEvent, useEventListener } from "expo";
import { useKeepAwake } from "expo-keep-awake";
import { useVideoPlayer, VideoView } from "expo-video";
import { FastForwardIcon } from "phosphor-react-native/src/icons/FastForward";
import { PauseIcon } from "phosphor-react-native/src/icons/Pause";
import { PlayIcon } from "phosphor-react-native/src/icons/Play";
import { RewindIcon } from "phosphor-react-native/src/icons/Rewind";
import { XIcon } from "phosphor-react-native/src/icons/X";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type LayoutChangeEvent,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Spinner, Text, XStack, YStack } from "tamagui";

import { useDismissGesture } from "@/hooks/useDismissGesture";
import { useVisibleWhenUnlocked } from "@/hooks/useVisibleWhenUnlocked";
import {
  MIN_TAP_SIZE,
  OVERLAY_BG,
  OVERLAY_INK,
  PILL_RADIUS,
  PRESS_OPACITY,
} from "@/lib/design";
import i18n from "@/lib/i18n";
import { formatDuration } from "@/lib/video";

const CLOSE_BUTTON_SIZE = MIN_TAP_SIZE;
const CLOSE_ICON_SIZE = 22;
const PLAY_BUTTON_SIZE = 64;
const PLAY_ICON_SIZE = 28;
const SKIP_BUTTON_SIZE = 48;
const SKIP_ICON_SIZE = 22;

const TRACK_HEIGHT = 4;
const THUMB_SIZE = 16;
const TRACK_HIT_SLOP = 12;

const TIME_UPDATE_INTERVAL = 0.25;
const CONTROLS_FADE_MILLIS = 150;
const SETTLE_TOLERANCE = 1;
const AUTO_HIDE_MILLIS = 3000;
const SEEK_STEP_SECONDS = 10;

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

function SeekBar({
  position,
  duration,
  onSeek,
  onScrubStart,
}: {
  position: number;
  duration: number;
  onSeek: (seconds: number) => void;
  onScrubStart: () => void;
}) {
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState<number | null>(null);

  const onLayout = (event: LayoutChangeEvent) =>
    setWidth(event.nativeEvent.layout.width);

  const ratioOf = (x: number) => (width > 0 ? clamp(x / width) : 0);

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((event) => {
      onScrubStart();
      setDragging(ratioOf(event.x));
    })
    .onUpdate((event) => setDragging(ratioOf(event.x)))
    // 움직임 없는 탭은 Pan이 실패로 끝나므로 성공 여부와 상관없이 놓은 자리로 간다.
    .onFinalize((event) => {
      onSeek(ratioOf(event.x) * duration);
      setDragging(null);
    })
    .runOnJS(true);

  const shown = dragging !== null ? dragging * duration : position;
  const ratio = duration > 0 ? clamp(shown / duration) : 0;

  return (
    <XStack items="center" gap="$3">
      <Text fontSize="$2" color={OVERLAY_INK} fontWeight="600">
        {formatDuration(Math.floor(shown))}
      </Text>

      <GestureDetector gesture={pan}>
        <YStack
          flex={1}
          py={TRACK_HIT_SLOP}
          justify="center"
          onLayout={onLayout}
          accessibilityRole="adjustable"
          accessibilityLabel={i18n.t("a11y.seekBar")}
          accessibilityValue={{
            min: 0,
            max: Math.floor(duration),
            now: Math.floor(shown),
            text: formatDuration(Math.floor(shown)),
          }}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(event) => {
            const step =
              event.nativeEvent.actionName === "increment"
                ? SEEK_STEP_SECONDS
                : -SEEK_STEP_SECONDS;

            onSeek(Math.min(duration, Math.max(0, position + step)));
          }}
        >
          <YStack height={TRACK_HEIGHT} bg="rgba(255, 255, 255, 0.35)">
            <YStack
              height={TRACK_HEIGHT}
              width={width * ratio}
              bg={OVERLAY_INK}
            />
          </YStack>

          <YStack
            position="absolute"
            l={width * ratio - THUMB_SIZE / 2}
            width={THUMB_SIZE}
            height={THUMB_SIZE}
            rounded={PILL_RADIUS}
            bg={OVERLAY_INK}
          />
        </YStack>
      </GestureDetector>

      <Text fontSize="$2" color={OVERLAY_INK} fontWeight="600">
        {formatDuration(Math.floor(duration))}
      </Text>
    </XStack>
  );
}

function SkipButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <XStack
      width={SKIP_BUTTON_SIZE}
      height={SKIP_BUTTON_SIZE}
      items="center"
      justify="center"
      rounded={PILL_RADIUS}
      bg={OVERLAY_BG}
      pressStyle={{ opacity: PRESS_OPACITY }}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
    >
      {children}
    </XStack>
  );
}

function Player({ url, onClose }: { url: string; onClose: () => void }) {
  useKeepAwake();

  const player = useVideoPlayer(url, (instance) => {
    instance.timeUpdateEventInterval = TIME_UPDATE_INTERVAL;
    instance.play();
  });
  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });
  const currentTime = useEvent(player, "timeUpdate")?.currentTime ?? 0;
  const { status } = useEvent(player, "statusChange", {
    status: player.status,
  });
  const [seekTarget, setSeekTarget] = useState<number | null>(null);
  const [ended, setEnded] = useState(false);
  const [visible, setVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeAfterSeek = useRef(false);
  const dismiss = useDismissGesture({ onClose });

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

  // 시크 직후 플레이어가 새 위치를 알려 줄 때까지는 목표 위치를 그린다.
  // 안 그러면 이전 위치로 튀었다가 돌아와 깜빡인다.
  useEventListener(player, "timeUpdate", (event) => {
    if (
      seekTarget !== null &&
      Math.abs(event.currentTime - seekTarget) < SETTLE_TOLERANCE
    ) {
      setSeekTarget(null);
    }
  });

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

  const holdControls = () => {
    clearHide();
    setVisible(true);
  };

  const beginScrub = () => {
    holdControls();

    if (isPlaying) {
      resumeAfterSeek.current = true;
      player.pause();
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

  const loading = status === "loading";
  const failed = status === "error";
  const controlsShown = (visible || failed) && !loading;
  const controlsStyle = useAnimatedStyle(() => ({
    opacity: withTiming(controlsShown ? 1 : 0, {
      duration: CONTROLS_FADE_MILLIS,
    }),
  }));

  const seek = (seconds: number) => {
    player.currentTime = seconds;
    setSeekTarget(seconds);
    setEnded(false);

    if (resumeAfterSeek.current) {
      resumeAfterSeek.current = false;
      player.play();
    }

    showControls();
  };

  const skip = (step: number) => {
    seek(
      Math.min(
        player.duration,
        Math.max(0, (seekTarget ?? currentTime) + step),
      ),
    );
  };

  // 안드로이드 Modal은 별도 루트라 제스처가 먹으려면 여기서 다시 감싸야 한다.
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />

        <Animated.View style={[styles.backdrop, dismiss.backdropStyle]} />

        <GestureDetector gesture={dismiss.gesture}>
          <Animated.View style={[{ flex: 1 }, dismiss.contentStyle]}>
            <VideoView
              player={player}
              style={{ flex: 1 }}
              contentFit="contain"
              nativeControls={false}
              allowsPictureInPicture={false}
            />

            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => (visible ? setVisible(false) : showControls())}
            />

            {loading && (
              <YStack
                position="absolute"
                t={0}
                r={0}
                b={0}
                l={0}
                items="center"
                justify="center"
                pointerEvents="none"
              >
                <Spinner size="small" color={OVERLAY_INK} />
              </YStack>
            )}

            {failed && (
              <YStack
                position="absolute"
                t={0}
                r={0}
                b={0}
                l={0}
                items="center"
                justify="center"
                pointerEvents="none"
              >
                <Text fontSize="$4" color={OVERLAY_INK} fontWeight="600">
                  {i18n.t("hook.videoUrlFailed")}
                </Text>
              </YStack>
            )}
          </Animated.View>
        </GestureDetector>

        <Animated.View
          style={[StyleSheet.absoluteFill, dismiss.chromeStyle]}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[StyleSheet.absoluteFill, controlsStyle]}
            pointerEvents={controlsShown ? "box-none" : "none"}
          >
            <SafeAreaView
              edges={["top"]}
              style={{ position: "absolute", top: 0, left: 0, right: 0 }}
            >
              <XStack p="$2">
                <XStack
                  width={CLOSE_BUTTON_SIZE}
                  height={CLOSE_BUTTON_SIZE}
                  rounded={PILL_RADIUS}
                  bg={OVERLAY_BG}
                  items="center"
                  justify="center"
                  pressStyle={{ opacity: PRESS_OPACITY }}
                  accessibilityRole="button"
                  accessibilityLabel={i18n.t("a11y.close")}
                  onPress={onClose}
                >
                  <XIcon
                    size={CLOSE_ICON_SIZE}
                    weight="bold"
                    color={OVERLAY_INK}
                  />
                </XStack>
              </XStack>
            </SafeAreaView>

            {!failed && (
              <>
                <XStack
                  position="absolute"
                  t={0}
                  r={0}
                  b={0}
                  l={0}
                  items="center"
                  justify="center"
                  gap="$6"
                  pointerEvents="box-none"
                >
                  <SkipButton
                    label={i18n.t("a11y.seekBackward", {
                      seconds: SEEK_STEP_SECONDS,
                    })}
                    onPress={() => skip(-SEEK_STEP_SECONDS)}
                  >
                    <RewindIcon
                      size={SKIP_ICON_SIZE}
                      weight="fill"
                      color={OVERLAY_INK}
                    />
                  </SkipButton>

                  <XStack
                    width={PLAY_BUTTON_SIZE}
                    height={PLAY_BUTTON_SIZE}
                    items="center"
                    justify="center"
                    rounded={PILL_RADIUS}
                    bg={OVERLAY_BG}
                    pressStyle={{ opacity: PRESS_OPACITY }}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isPlaying && !ended
                        ? i18n.t("a11y.pause")
                        : i18n.t("a11y.play")
                    }
                    onPress={togglePlay}
                  >
                    {isPlaying && !ended ? (
                      <PauseIcon
                        size={PLAY_ICON_SIZE}
                        weight="fill"
                        color={OVERLAY_INK}
                      />
                    ) : (
                      <PlayIcon
                        size={PLAY_ICON_SIZE}
                        weight="fill"
                        color={OVERLAY_INK}
                      />
                    )}
                  </XStack>

                  <SkipButton
                    label={i18n.t("a11y.seekForward", {
                      seconds: SEEK_STEP_SECONDS,
                    })}
                    onPress={() => skip(SEEK_STEP_SECONDS)}
                  >
                    <FastForwardIcon
                      size={SKIP_ICON_SIZE}
                      weight="fill"
                      color={OVERLAY_INK}
                    />
                  </SkipButton>
                </XStack>

                <SafeAreaView
                  edges={["bottom"]}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                >
                  <YStack px="$4" py="$3" bg={OVERLAY_BG}>
                    <SeekBar
                      position={seekTarget ?? currentTime}
                      duration={player.duration}
                      onSeek={seek}
                      onScrubStart={beginScrub}
                    />
                  </YStack>
                </SafeAreaView>
              </>
            )}
          </Animated.View>
        </Animated.View>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "black",
  },
});

export function VideoPlayerModal({
  url,
  onClose,
}: {
  url: string | null;
  onClose: () => void;
}) {
  const visible = useVisibleWhenUnlocked(url !== null);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {visible && url && <Player url={url} onClose={onClose} />}
    </Modal>
  );
}
