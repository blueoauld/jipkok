import { Image } from "expo-image";
import { ImageIcon } from "phosphor-react-native/src/icons/Image";
import { LockSimpleIcon } from "phosphor-react-native/src/icons/LockSimple";
import { useState } from "react";
import { useWindowDimensions } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import { PagedPhotos, PhotoDots } from "@/components/photo/PagedPhotos";
import { PhotoViewer } from "@/components/photo/PhotoViewer";
import {
  IMAGE_TRANSITION,
  PHOTO_PRESS_OPACITY,
  RETRO_BORDER_WIDTH,
} from "@/lib/design";
import { photoCacheKey } from "@/lib/photo";

const PHOTO_RATIO = 0.8;

const PLACEHOLDER_ICON_SIZE = 48;

const BADGE_SIZE = 24;

const BADGE_ICON_SIZE = 14;

export function PhotoPager({
  photos,
  secretFrom,
}: {
  photos: string[];
  secretFrom?: number;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);

  const height = width * PHOTO_RATIO;
  const hasSecret = secretFrom !== undefined;

  if (photos.length === 0) {
    return (
      <YStack
        height={height}
        bg="$color1"
        borderTopWidth={RETRO_BORDER_WIDTH}
        borderBottomWidth={RETRO_BORDER_WIDTH}
        borderColor="$gray12"
        items="center"
        justify="center"
      >
        <ImageIcon size={PLACEHOLDER_ICON_SIZE} color={theme.color12.val} />
      </YStack>
    );
  }

  return (
    <YStack
      width={width}
      bg="$gray12"
      borderTopWidth={RETRO_BORDER_WIDTH}
      borderBottomWidth={RETRO_BORDER_WIDTH}
      borderColor="$gray12"
    >
      <PagedPhotos
        photos={photos}
        itemWidth={width}
        index={index}
        onIndexChange={setIndex}
        renderPhoto={(photo, photoIndex) => (
          <XStack
            width={width}
            height={height}
            bg="$gray12"
            pressStyle={{ opacity: PHOTO_PRESS_OPACITY }}
            onPress={() => setViewerOpen(true)}
          >
            <Image
              source={{ uri: photo, cacheKey: photoCacheKey(photo) }}
              cachePolicy={
                hasSecret && photoIndex >= secretFrom ? "memory" : "disk"
              }
              contentFit="cover"
              transition={IMAGE_TRANSITION}
              style={{ width, height }}
            />

            {hasSecret && photoIndex >= secretFrom && (
              <XStack
                position="absolute"
                t="$3"
                l="$3"
                width={BADGE_SIZE}
                height={BADGE_SIZE}
                bg="$gray12"
                items="center"
                justify="center"
              >
                <LockSimpleIcon
                  size={BADGE_ICON_SIZE}
                  weight="fill"
                  color={theme.color1.val}
                />
              </XStack>
            )}
          </XStack>
        )}
      />

      <YStack position="absolute" b="$3" l={0} r={0}>
        <PhotoDots count={photos.length} index={index} />
      </YStack>

      <PhotoViewer
        photos={photos}
        initialIndex={index}
        open={viewerOpen}
        secret={hasSecret}
        onClose={() => setViewerOpen(false)}
      />
    </YStack>
  );
}
