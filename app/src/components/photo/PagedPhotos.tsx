import type { ReactElement } from "react";
import { FlatList } from "react-native-gesture-handler";

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
