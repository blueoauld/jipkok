import {
  DISABLED_OPACITY,
  PHOTO_PRESS_OPACITY,
  PRESS_OPACITY,
} from "@/lib/design";
import { Image } from "expo-image";
import { XIcon } from "phosphor-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  Modal,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  type ImageStyle,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import Zoom from "react-native-zoom-reanimated";
import { Spinner, XStack, YStack } from "tamagui";

const CLOSE_BUTTON_SIZE = 40;
const CLOSE_ICON_SIZE = 24;

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 800;

const TRANSITION = 150;

type Size = { width: number; height: number };

// 서명 URL은 요청마다 쿼리가 바뀌므로 오브젝트 경로만 캐시 키로 쓴다.
function toCacheKey(uri: string) {
  return uri.split("?")[0];
}

function fitInside(source: Size | undefined, screen: Size): Size {
  if (!source) {
    return screen;
  }

  const ratio = source.width / source.height;
  const width = screen.width;
  const height = width / ratio;

  return height > screen.height
    ? { width: screen.height * ratio, height: screen.height }
    : { width, height };
}

export function ChatImage({
  uri,
  style,
  uploading,
}: {
  uri: string;
  style: ImageStyle;
  uploading?: boolean;
}) {
  const screen = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<Size>();

  const translateY = useSharedValue(0);

  const openViewer = useCallback(() => {
    cancelAnimation(translateY);
    translateY.value = 0;
    setOpen(true);
  }, [translateY]);

  const closeViewer = useCallback(() => setOpen(false), []);

  const imageSize = useMemo(
    () => fitInside(size, { width: screen.width, height: screen.height }),
    [size, screen.width, screen.height],
  );

  const dismissGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-20, 20])
        .onUpdate((event) => {
          translateY.value = event.translationY;
        })
        .onEnd((event) => {
          const shouldClose =
            Math.abs(event.translationY) > DISMISS_DISTANCE ||
            Math.abs(event.velocityY) > DISMISS_VELOCITY;

          if (!shouldClose) {
            translateY.value = withSpring(0);
            return;
          }

          const direction = event.translationY > 0 ? 1 : -1;

          translateY.value = withTiming(
            direction * screen.height,
            { duration: 200 },
            (finished) => {
              if (finished) {
                scheduleOnRN(closeViewer);
              }
            },
          );
        }),
    [closeViewer, screen.height, translateY],
  );

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      Math.abs(translateY.value),
      [0, screen.height / 2],
      [1, 0],
      "clamp",
    ),
  }));

  return (
    <>
      <XStack
        pressStyle={uploading ? undefined : { opacity: PHOTO_PRESS_OPACITY }}
        onPress={uploading ? undefined : openViewer}
      >
        <Image
          source={{ uri, cacheKey: toCacheKey(uri) }}
          style={style}
          contentFit="cover"
          transition={TRANSITION}
        />

        {uploading && (
          <YStack
            position="absolute"
            t={0}
            r={0}
            b={0}
            l={0}
            rounded={
              typeof style.borderRadius === "number" ? style.borderRadius : 0
            }
            bg="black"
            opacity={DISABLED_OPACITY}
            items="center"
            justify="center"
          >
            <Spinner size="small" color="white" />
          </YStack>
        )}
      </XStack>

      <Modal
        visible={open}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={closeViewer}
      >
        <StatusBar barStyle="light-content" />

        <SafeAreaProvider>
          <GestureHandlerRootView style={styles.viewer}>
            <Animated.View style={[styles.backdrop, backdropStyle]} />

            <YStack flex={1}>
              <SafeAreaView edges={["top"]}>
                <XStack p="$2">
                  <XStack
                    width={CLOSE_BUTTON_SIZE}
                    height={CLOSE_BUTTON_SIZE}
                    items="center"
                    justify="center"
                    pressStyle={{ opacity: PRESS_OPACITY }}
                    onPress={closeViewer}
                  >
                    <XIcon size={CLOSE_ICON_SIZE} weight="bold" color="white" />
                  </XStack>
                </XStack>
              </SafeAreaView>

              <GestureDetector gesture={dismissGesture}>
                <Animated.View style={[styles.content, contentStyle]}>
                  <Zoom>
                    <Image
                      source={{ uri, cacheKey: toCacheKey(uri) }}
                      style={imageSize}
                      contentFit="contain"
                      onLoad={({ source }) =>
                        setSize({
                          width: source.width,
                          height: source.height,
                        })
                      }
                    />
                  </Zoom>
                </Animated.View>
              </GestureDetector>
            </YStack>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  viewer: {
    flex: 1,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "black",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
