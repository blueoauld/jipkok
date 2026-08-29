import { Image } from "expo-image";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { useMemo, useRef, useState } from "react";
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

import { PagedPhotos, PhotoDots } from "@/components/photo/PagedPhotos";
import { useSecretPhotoCapture } from "@/hooks/useSecretPhotoCapture";
import { IMAGE_TRANSITION, MIN_TAP_SIZE, PRESS_OPACITY } from "@/lib/design";
import { photoCacheKey } from "@/lib/photo";

const CLOSE_BUTTON_SIZE = MIN_TAP_SIZE;

const CLOSE_ICON_SIZE = 24;

const DISMISS_DISTANCE = 120;

const DISMISS_VELOCITY = 800;

const DISMISS_DURATION = 200;

const GESTURE_SLOP = 20;

export function PhotoViewer({
  photos,
  initialIndex,
  open,
  secret = false,
  onClose,
}: {
  photos: string[];
  initialIndex: number;
  open: boolean;
  secret?: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {open ? (
        <ViewerContent
          photos={photos}
          initialIndex={initialIndex}
          secret={secret}
          onClose={onClose}
        />
      ) : null}
    </Modal>
  );
}

function ViewerContent({
  photos,
  initialIndex,
  secret,
  onClose,
}: {
  photos: string[];
  initialIndex: number;
  secret: boolean;
  onClose: () => void;
}) {
  const screen = useWindowDimensions();
  const listRef = useRef<FlatList<string>>(null);
  const [index, setIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);
  const translateY = useSharedValue(0);

  useSecretPhotoCapture(secret);

  const dismissGesture = useMemo(
    () =>
      Gesture.Pan()
        // 확대 중에는 손가락이 사진을 끄는 것이므로 닫기가 끼어들면 안 된다.
        .enabled(!zoomed)
        .activeOffsetY([-GESTURE_SLOP, GESTURE_SLOP])
        .failOffsetX([-GESTURE_SLOP, GESTURE_SLOP])
        .onUpdate((event) => {
          translateY.value = event.translationY;
        })
        .onEnd((event) => {
          const dragged = Math.abs(event.translationY) > DISMISS_DISTANCE;
          const flicked = Math.abs(event.velocityY) > DISMISS_VELOCITY;

          if (!dragged && !flicked) {
            translateY.value = withSpring(0);
            return;
          }

          const direction = event.translationY > 0 ? 1 : -1;

          translateY.value = withTiming(
            direction * screen.height,
            { duration: DISMISS_DURATION },
            (finished) => {
              if (finished) {
                scheduleOnRN(onClose);
              }
            },
          );
        }),
    [onClose, screen.height, translateY, zoomed],
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
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.root}>
        <StatusBar barStyle="light-content" />

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
                onPress={onClose}
              >
                <XIcon size={CLOSE_ICON_SIZE} weight="bold" color="white" />
              </XStack>
            </XStack>
          </SafeAreaView>

          <GestureDetector gesture={dismissGesture}>
            <Animated.View style={[styles.content, contentStyle]}>
              <PagedPhotos
                photos={photos}
                itemWidth={screen.width}
                index={index}
                listRef={listRef}
                onIndexChange={setIndex}
                renderPhoto={(photo, photoIndex) => (
                  <YStack
                    width={screen.width}
                    height="100%"
                    items="center"
                    justify="center"
                  >
                    <Zoom
                      enableGallerySwipe
                      parentScrollRef={listRef}
                      currentIndex={photoIndex}
                      itemWidth={screen.width}
                      onZoomStateChange={setZoomed}
                    >
                      <Image
                        source={{ uri: photo, cacheKey: photoCacheKey(photo) }}
                        cachePolicy={secret ? "memory" : "disk"}
                        contentFit="contain"
                        transition={IMAGE_TRANSITION}
                        style={{ width: screen.width, height: screen.height }}
                      />
                    </Zoom>
                  </YStack>
                )}
              />
            </Animated.View>
          </GestureDetector>

          <SafeAreaView edges={["bottom"]} style={styles.dots}>
            <YStack pb="$6">
              <PhotoDots count={photos.length} index={index} />
            </YStack>
          </SafeAreaView>
        </YStack>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
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
  dots: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
  },
});
