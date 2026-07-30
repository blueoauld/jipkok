import { Image } from "expo-image";
import { useState } from "react";
import { FlatList, useWindowDimensions } from "react-native";
import { XStack, YStack } from "tamagui";

import { PhotoViewer } from "@/components/PhotoViewer";

const PHOTO_RATIO = 0.8;

export function PhotoPager({ photos }: { photos: string[] }) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);

  const openViewer = () => setViewerOpen(true);

  return (
    <YStack>
      <FlatList
        data={photos}
        keyExtractor={(uri) => uri}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) =>
          setIndex(Math.round(event.nativeEvent.contentOffset.x / width))
        }
        renderItem={({ item }) => (
          <XStack pressStyle={{ opacity: 0.8 }} onPress={openViewer}>
            <Image
              source={item}
              contentFit="cover"
              style={{ width, height: width * PHOTO_RATIO }}
            />
          </XStack>
        )}
      />

      <XStack position="absolute" b="$3" l={0} r={0} justify="center" gap="$2">
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

      <PhotoViewer
        photos={photos}
        initialIndex={index}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </YStack>
  );
}
