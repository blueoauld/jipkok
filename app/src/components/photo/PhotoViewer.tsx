import { Image } from "expo-image";
import { XIcon } from "phosphor-react-native/src/icons/X";
import type { RefObject } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import {
  Modal,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import {
  FlatList,
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { useZoomGesture } from "react-native-zoom-reanimated";
import { XStack, YStack } from "tamagui";

import { PagedPhotos, PhotoDots } from "@/components/photo/PagedPhotos";
import { useSecretPhotoCapture } from "@/hooks/useSecretPhotoCapture";
import { IMAGE_TRANSITION, MIN_TAP_SIZE, PRESS_OPACITY } from "@/lib/design";
import i18n from "@/lib/i18n";
import { photoCacheKey } from "@/lib/photo";

const CLOSE_BUTTON_SIZE = MIN_TAP_SIZE;

const CLOSE_ICON_SIZE = 24;

const DISMISS_DISTANCE = 120;

const DISMISS_VELOCITY = 800;

const DISMISS_DURATION = 200;

const CHROME_DURATION = 200;

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
  const [chromeVisible, setChromeVisible] = useState(true);
  const translateY = useSharedValue(0);

  useSecretPhotoCapture(secret);

  const toggleChrome = useCallback(
    () => setChromeVisible((visible) => !visible),
    [],
  );

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

  const chromeStyle = useAnimatedStyle(
    () => ({
      opacity: withTiming(chromeVisible ? 1 : 0, {
        duration: CHROME_DURATION,
      }),
    }),
    [chromeVisible],
  );

  const chromePointerEvents = chromeVisible ? "auto" : "none";

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.root}>
        <StatusBar barStyle="light-content" />

        <Animated.View style={[styles.backdrop, backdropStyle]} />

        <YStack flex={1}>
          <GestureDetector gesture={dismissGesture}>
            <Animated.View style={[styles.content, contentStyle]}>
              <PagedPhotos
                photos={photos}
                itemWidth={screen.width}
                index={index}
                listRef={listRef}
                onIndexChange={setIndex}
                renderPhoto={(photo, photoIndex) => (
                  <ZoomablePhoto
                    photo={photo}
                    photoIndex={photoIndex}
                    secret={secret}
                    listRef={listRef}
                    onZoomStateChange={setZoomed}
                    onTap={toggleChrome}
                  />
                )}
              />
            </Animated.View>
          </GestureDetector>

          <Animated.View
            style={[styles.header, chromeStyle]}
            pointerEvents={chromePointerEvents}
          >
            <SafeAreaView edges={["top"]}>
              <XStack p="$2">
                <XStack
                  width={CLOSE_BUTTON_SIZE}
                  height={CLOSE_BUTTON_SIZE}
                  items="center"
                  justify="center"
                  pressStyle={{ opacity: PRESS_OPACITY }}
                  accessibilityRole="button"
                  accessibilityLabel={i18n.t("a11y.close")}
                  onPress={onClose}
                >
                  <XIcon size={CLOSE_ICON_SIZE} weight="bold" color="white" />
                </XStack>
              </XStack>
            </SafeAreaView>
          </Animated.View>

          <Animated.View
            style={[styles.dots, chromeStyle]}
            pointerEvents={chromePointerEvents}
          >
            <SafeAreaView edges={["bottom"]}>
              <YStack pb="$6">
                <PhotoDots count={photos.length} index={index} />
              </YStack>
            </SafeAreaView>
          </Animated.View>
        </YStack>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

function ZoomablePhoto({
  photo,
  photoIndex,
  secret,
  listRef,
  onZoomStateChange,
  onTap,
}: {
  photo: string;
  photoIndex: number;
  secret: boolean;
  listRef: RefObject<FlatList<string> | null>;
  onZoomStateChange: (zoomed: boolean) => void;
  onTap: () => void;
}) {
  const screen = useWindowDimensions();
  const {
    zoomGesture,
    contentContainerAnimatedStyle,
    onLayout,
    onLayoutContent,
    isZoomedIn,
  } = useZoomGesture({
    enableGallerySwipe: true,
    parentScrollRef: listRef,
    currentIndex: photoIndex,
    itemWidth: screen.width,
  });

  useAnimatedReaction(
    () => isZoomedIn.value,
    (current, previous) => {
      if (current !== previous) {
        scheduleOnRN(onZoomStateChange, current);
      }
    },
    [onZoomStateChange],
  );

  // 라이브러리의 더블탭이 실패해야 단일 탭으로 인정되므로 Exclusive로 묶는다.
  const gesture = useMemo(
    () =>
      Gesture.Exclusive(
        zoomGesture,
        Gesture.Tap().runOnJS(true).onStart(onTap),
      ),
    [onTap, zoomGesture],
  );

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={[styles.zoomContainer, { width: screen.width }]}
        onLayout={onLayout}
        collapsable={false}
      >
        <Animated.View
          style={contentContainerAnimatedStyle as StyleProp<ViewStyle>}
          onLayout={onLayoutContent}
        >
          <Image
            source={{ uri: photo, cacheKey: photoCacheKey(photo) }}
            cachePolicy={secret ? "memory" : "disk"}
            contentFit="contain"
            transition={IMAGE_TRANSITION}
            style={{ width: screen.width, height: screen.height }}
          />
        </Animated.View>
      </View>
    </GestureDetector>
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
  zoomContainer: {
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  dots: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
  },
});
