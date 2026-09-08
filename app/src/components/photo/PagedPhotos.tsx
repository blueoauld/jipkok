import type { ReactElement } from "react";
import { FlatList } from "react-native-gesture-handler";
import { XStack, YStack } from "tamagui";

import { OVERLAY_INK } from "@/lib/design";

const DOT_SIZE = 6;

const INACTIVE_DOT_OPACITY = 0.4;

export function PagedPhotos({
  photos,
  itemWidth,
  index,
  renderPhoto,
  onIndexChange,
}: {
  photos: string[];
  itemWidth: number;
  index: number;
  renderPhoto: (photo: string, photoIndex: number) => ReactElement;
  onIndexChange: (index: number) => void;
}) {
  return (
    <FlatList
      data={photos}
      keyExtractor={(photo, photoIndex) => `${photoIndex}-${photo}`}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      initialScrollIndex={index}
      getItemLayout={(_, photoIndex) => ({
        length: itemWidth,
        offset: itemWidth * photoIndex,
        index: photoIndex,
      })}
      onMomentumScrollEnd={(event) => {
        const next = Math.round(event.nativeEvent.contentOffset.x / itemWidth);

        if (next !== index) {
          onIndexChange(next);
        }
      }}
      renderItem={({ item, index: photoIndex }) =>
        renderPhoto(item, photoIndex)
      }
    />
  );
}

export function PhotoDots({ count, index }: { count: number; index: number }) {
  if (count < 2) {
    return null;
  }

  return (
    <XStack justify="center" gap="$2">
      {Array.from({ length: count }, (_, dotIndex) => (
        <YStack
          key={dotIndex}
          width={DOT_SIZE}
          height={DOT_SIZE}
          rounded={0}
          bg={OVERLAY_INK}
          opacity={dotIndex === index ? 1 : INACTIVE_DOT_OPACITY}
        />
      ))}
    </XStack>
  );
}
