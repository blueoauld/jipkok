import { Image } from "expo-image";
import { ImageIcon } from "phosphor-react-native/src/icons/Image";
import { LockSimpleIcon } from "phosphor-react-native/src/icons/LockSimple";
import { useState } from "react";
import { FlatList, useWindowDimensions } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import { PhotoViewer } from "@/components/PhotoViewer";
import { PHOTO_PRESS_OPACITY } from "@/lib/design";

const PHOTO_RATIO = 0.8;

const PHOTO_TRANSITION = 200;

const PLACEHOLDER_ICON_SIZE = 48;

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

  const openViewer = () => setViewerOpen(true);
  const isSecret = (photoIndex: number) =>
    secretFrom !== undefined && photoIndex >= secretFrom;

  if (photos.length === 0) {
    return (
      <YStack
        height={width * PHOTO_RATIO}
        bg="$gray4"
        items="center"
        justify="center"
      >
        <ImageIcon size={PLACEHOLDER_ICON_SIZE} color={theme.gray9.val} />
      </YStack>
    );
  }

  return (
    <YStack>
      <FlatList
        data={photos}
        keyExtractor={(uri, photoIndex) => `${photoIndex}-${uri}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) =>
          setIndex(Math.round(event.nativeEvent.contentOffset.x / width))
        }
        renderItem={({ item, index: photoIndex }) => (
          <XStack
            bg="$gray4"
            pressStyle={{ opacity: PHOTO_PRESS_OPACITY }}
            onPress={openViewer}
          >
            <Image
              source={item}
              contentFit="cover"
              transition={PHOTO_TRANSITION}
              style={{ width, height: width * PHOTO_RATIO }}
            />

            {isSecret(photoIndex) && (
              <XStack
                position="absolute"
                t="$3"
                l="$3"
                width={24}
                height={24}
                rounded={0}
                bg="$gray12"
                items="center"
                justify="center"
              >
                <LockSimpleIcon
                  size={BADGE_ICON_SIZE}
                  weight="fill"
                  color="white"
                />
              </XStack>
            )}
          </XStack>
        )}
      />

      <XStack position="absolute" b="$3" l={0} r={0} justify="center" gap="$2">
        {photos.map((uri, photoIndex) => (
          <YStack
            key={`${photoIndex}-${uri}`}
            width={6}
            height={6}
            rounded={0}
            bg="white"
            opacity={photoIndex === index ? 1 : 0.4}
          />
        ))}
      </XStack>

      <PhotoViewer
        photos={photos}
        initialIndex={index}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </YStack>
  );
}
