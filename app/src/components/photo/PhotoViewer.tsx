import { Image, type ImageLoadEventData } from "expo-image";
import { XIcon } from "phosphor-react-native/src/icons/X";
import type { RefObject } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import type { ScaledSize, StyleProp, ViewStyle } from "react-native";
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
  useAnimatedReaction,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { useZoomGesture } from "react-native-zoom-reanimated";
import { XStack, YStack } from "tamagui";

import { PagedPhotos, PhotoDots } from "@/components/photo/PagedPhotos";
import { useDismissGesture } from "@/hooks/useDismissGesture";
import { useSecretPhotoCapture } from "@/hooks/useSecretPhotoCapture";
import {
  IMAGE_TRANSITION,
  MIN_TAP_SIZE,
  OVERLAY_BG,
  PRESS_OPACITY,
} from "@/lib/design";
import i18n from "@/lib/i18n";
import { photoCacheKey } from "@/lib/photo";

const CLOSE_BUTTON_SIZE = MIN_TAP_SIZE;

const CLOSE_ICON_SIZE = 24;

const CHROME_DURATION = 200;

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

  useSecretPhotoCapture(secret);

  // 확대 중에는 손가락이 사진을 끄는 것이므로 닫기가 끼어들면 안 된다.
  const dismiss = useDismissGesture({ enabled: !zoomed, onClose });

  const toggleChrome = useCallback(
    () => setChromeVisible((visible) => !visible),
    [],
  );

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

        <Animated.View style={[styles.backdrop, dismiss.backdropStyle]} />

        <YStack flex={1}>
          <GestureDetector gesture={dismiss.gesture}>
            <Animated.View style={[styles.content, dismiss.contentStyle]}>
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
                  bg={OVERLAY_BG}
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
              <YStack pb="$6" items="center">
                {photos.length > 1 && (
                  <XStack px="$3" py="$2" bg={OVERLAY_BG}>
                    <PhotoDots count={photos.length} index={index} />
                  </XStack>
                )}
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
  const [size, setSize] = useState<{ width: number; height: number }>();
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
            style={size ?? { width: screen.width, height: screen.height }}
            onLoad={(event) => setSize(fitToScreen(event, screen))}
          />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

// 뷰를 화면 크기로 두면 줌 라이브러리가 검은 여백까지 콘텐츠로 계산해서
// 확대한 사진을 화면 밖으로 밀어낼 수 있다. 실제 표시 크기에 맞춘다.
function fitToScreen(event: ImageLoadEventData, screen: ScaledSize) {
  const { width, height } = event.source;
  const scale = Math.min(screen.width / width, screen.height / height);

  return { width: width * scale, height: height * scale };
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
