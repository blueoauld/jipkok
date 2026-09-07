import { Image, type ImageLoadEventData } from "expo-image";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { useCallback, useState } from "react";
import type { ScaledSize } from "react-native";
import {
  Modal,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { Gallery, type VerticalPullOptions } from "react-native-zoom-toolkit";
import { XStack, YStack } from "tamagui";

import { PhotoDots } from "@/components/photo/PagedPhotos";
import { shouldDismiss, useDismissStyles } from "@/hooks/useDismissGesture";
import { useSecretPhotoCapture } from "@/hooks/useSecretPhotoCapture";
import { useVisibleWhenUnlocked } from "@/hooks/useVisibleWhenUnlocked";
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

// 더블탭도 이 배율까지 확대되므로 핀치 상한과 더블탭 배율을 한 값으로 절충한다.
const MAX_SCALE = 3;

export function PhotoViewer({
  photos,
  initialIndex,
  open: requested,
  secret = false,
  onClose,
}: {
  photos: string[];
  initialIndex: number;
  open: boolean;
  secret?: boolean;
  onClose: () => void;
}) {
  const open = useVisibleWhenUnlocked(requested);

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
  const [index, setIndex] = useState(initialIndex);
  const [chromeVisible, setChromeVisible] = useState(true);
  const pullY = useSharedValue(0);
  const dismissed = useSharedValue(false);

  useSecretPhotoCapture(secret);

  const toggleChrome = useCallback(
    () => setChromeVisible((visible) => !visible),
    [],
  );

  // 갤러리는 손을 떼면 사진을 제자리로 되돌리므로, 닫기로 판정되면 내용을 바로 숨기고
  // Modal 페이드에 맡긴다.
  const onVerticalPull = useCallback(
    ({ translateY, released, velocityY }: VerticalPullOptions) => {
      "worklet";

      if (dismissed.value) {
        return;
      }

      pullY.value = translateY;

      if (released && shouldDismiss(translateY, velocityY)) {
        dismissed.value = true;
        scheduleOnRN(onClose);
      }
    },
    [dismissed, onClose, pullY],
  );

  const renderPhoto = useCallback(
    (photo: string) => <GalleryPhoto photo={photo} secret={secret} />,
    [secret],
  );

  const pull = useDismissStyles(pullY);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: dismissed.value ? 0 : 1,
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

        <Animated.View style={[styles.root, contentStyle]}>
          <Animated.View style={[styles.backdrop, pull.backdropStyle]} />

          <YStack flex={1}>
            <Gallery
              data={photos}
              keyExtractor={(photo, photoIndex) => `${photoIndex}-${photo}`}
              initialIndex={initialIndex}
              maxScale={MAX_SCALE}
              tapOnEdgeToItem={false}
              renderItem={renderPhoto}
              onTap={toggleChrome}
              onIndexChange={setIndex}
              onVerticalPull={onVerticalPull}
            />

            <Animated.View
              style={[StyleSheet.absoluteFill, pull.chromeStyle]}
              pointerEvents="box-none"
            >
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
                      <XIcon
                        size={CLOSE_ICON_SIZE}
                        weight="bold"
                        color="white"
                      />
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
            </Animated.View>
          </YStack>
        </Animated.View>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

function GalleryPhoto({ photo, secret }: { photo: string; secret: boolean }) {
  const screen = useWindowDimensions();
  const [size, setSize] = useState<{ width: number; height: number }>();

  return (
    <Image
      source={{ uri: photo, cacheKey: photoCacheKey(photo) }}
      cachePolicy={secret ? "memory" : "disk"}
      contentFit="contain"
      transition={IMAGE_TRANSITION}
      style={size ?? { width: screen.width, height: screen.height }}
      onLoad={(event) => setSize(fitToScreen(event, screen))}
    />
  );
}

// 갤러리는 자식 뷰의 레이아웃 크기로 확대 범위를 계산하므로, 사진의 실제 표시 크기에
// 맞춰야 검은 여백까지 밀리지 않는다.
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
