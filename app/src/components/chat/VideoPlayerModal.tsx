import { useEvent, useEventListener } from "expo";
import { useKeepAwake } from "expo-keep-awake";
import { useVideoPlayer, VideoView } from "expo-video";
import { FastForwardIcon } from "phosphor-react-native/src/icons/FastForward";
import { PauseIcon } from "phosphor-react-native/src/icons/Pause";
import { PlayIcon } from "phosphor-react-native/src/icons/Play";
import { RewindIcon } from "phosphor-react-native/src/icons/Rewind";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, XStack, YStack } from "tamagui";

import {
  SEEK_STEP_SECONDS,
  SeekBar,
  TRACK_HIT_SLOP,
} from "@/components/chat/VideoSeekBar";
import { Text } from "@/components/ui/Text";
import {
  ViewerCloseButton,
  ViewerModal,
  ViewerRoot,
  ViewerRoundButton,
} from "@/components/ui/Viewer";
import { useDismissGesture } from "@/hooks/useDismissGesture";
import { OVERLAY_BG, OVERLAY_INK, SCREEN_PADDING } from "@/lib/design";
import i18n from "@/lib/i18n";

const PLAY_BUTTON_SIZE = 64;
const PLAY_ICON_SIZE = 28;
const SKIP_BUTTON_SIZE = 48;
const SKIP_ICON_SIZE = 22;

// 탐색 막대 선이 띠 위아래 끝에서도 좌우 여백만큼 떨어지도록 누르는 여유만큼 뺀다.
const SEEK_BAND_PADDING_Y = SCREEN_PADDING - TRACK_HIT_SLOP;

const TIME_UPDATE_INTERVAL = 0.25;
const CONTROLS_FADE_MILLIS = 150;
const SETTLE_TOLERANCE = 1;
const AUTO_HIDE_MILLIS = 3000;

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

  return (
    <ViewerRoot backdropStyle={dismiss.backdropStyle}>
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
              <Text preset="bodyStrong" color={OVERLAY_INK}>
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
            <ViewerCloseButton onClose={onClose} />
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
                <ViewerRoundButton
                  size={SKIP_BUTTON_SIZE}
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
                </ViewerRoundButton>

                <ViewerRoundButton
                  size={PLAY_BUTTON_SIZE}
                  label={
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
                </ViewerRoundButton>

                <ViewerRoundButton
                  size={SKIP_BUTTON_SIZE}
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
                </ViewerRoundButton>
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
                <YStack
                  px={SCREEN_PADDING}
                  py={SEEK_BAND_PADDING_Y}
                  bg={OVERLAY_BG}
                >
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
    </ViewerRoot>
  );
}

export function VideoPlayerModal({
  url,
  onClose,
}: {
  url: string | null;
  onClose: () => void;
}) {
  return (
    <ViewerModal open={url !== null} onClose={onClose}>
      {url && <Player url={url} onClose={onClose} />}
    </ViewerModal>
  );
}
