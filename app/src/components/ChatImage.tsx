import { XIcon } from "phosphor-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  Image,
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
import { XStack, YStack } from "tamagui";

const CLOSE_BUTTON_SIZE = 40;
const CLOSE_ICON_SIZE = 24;

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 800;

type Size = { width: number; height: number };

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

export function ChatImage({ uri, style }: { uri: string; style: ImageStyle }) {
  const screen = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<Size>();

  const translateY = useSharedValue(0);

  const openViewer = useCallback(() => {
    cancelAnimation(translateY);
    translateY.value = 0;
    setOpen(true);

    if (!size) {
      Image.getSize(uri, (width, height) => setSize({ width, height }));
    }
  }, [uri, size, translateY]);

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
      <XStack pressStyle={{ opacity: 0.8 }} onPress={openViewer}>
        <Image source={{ uri }} style={style} resizeMode="cover" />
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
                    pressStyle={{ opacity: 0.6 }}
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
                      source={{ uri }}
                      style={imageSize}
                      resizeMode="contain"
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
