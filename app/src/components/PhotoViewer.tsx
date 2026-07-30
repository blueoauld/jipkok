import { Image } from "expo-image";
import { XIcon } from "phosphor-react-native";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import {
  FlatList,
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

const PHOTO_TRANSITION = 200;

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 800;

export function PhotoViewer({
  photos,
  initialIndex,
  open,
  onClose,
}: {
  photos: string[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}) {
  const screen = useWindowDimensions();
  const listRef = useRef<FlatList<string>>(null);
  const [index, setIndex] = useState(initialIndex);

  const translateY = useSharedValue(0);

  useLayoutEffect(() => {
    if (open) {
      cancelAnimation(translateY);
      translateY.value = 0;
    }
  }, [open, translateY]);

  const dismissGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-20, 20])
        .failOffsetX([-20, 20])
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
                scheduleOnRN(onClose);
              }
            },
          );
        }),
    [onClose, screen.height, translateY],
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
    <Modal
      visible={open}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
      onShow={() => setIndex(initialIndex)}
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
                  onPress={onClose}
                >
                  <XIcon size={CLOSE_ICON_SIZE} weight="bold" color="white" />
                </XStack>
              </XStack>
            </SafeAreaView>

            <GestureDetector gesture={dismissGesture}>
              <Animated.View style={[styles.content, contentStyle]}>
                <FlatList
                  ref={listRef}
                  data={photos}
                  keyExtractor={(uri) => uri}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  initialScrollIndex={initialIndex}
                  getItemLayout={(_, itemIndex) => ({
                    length: screen.width,
                    offset: screen.width * itemIndex,
                    index: itemIndex,
                  })}
                  onMomentumScrollEnd={(event) =>
                    setIndex(
                      Math.round(
                        event.nativeEvent.contentOffset.x / screen.width,
                      ),
                    )
                  }
                  renderItem={({ item, index: itemIndex }) => (
                    <YStack
                      width={screen.width}
                      height="100%"
                      items="center"
                      justify="center"
                    >
                      <Zoom
                        enableGallerySwipe
                        parentScrollRef={listRef}
                        currentIndex={itemIndex}
                        itemWidth={screen.width}
                      >
                        <Image
                          source={item}
                          contentFit="contain"
                          transition={PHOTO_TRANSITION}
                          style={{ width: screen.width, height: screen.height }}
                        />
                      </Zoom>
                    </YStack>
                  )}
                />
              </Animated.View>
            </GestureDetector>

            <XStack
              position="absolute"
              b="$6"
              l={0}
              r={0}
              justify="center"
              gap="$2"
            >
              {photos.map((uri, photoIndex) => (
                <YStack
                  key={uri}
                  width={6}
                  height={6}
                  rounded={9999}
                  bg="white"
                  opacity={photoIndex === index ? 1 : 0.4}
                />
              ))}
            </XStack>
          </YStack>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </Modal>
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
  },
});
