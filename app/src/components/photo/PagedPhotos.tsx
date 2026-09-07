import type { ReactElement, RefObject } from "react";
import { useImperativeHandle, useRef } from "react";
import { FlatList } from "react-native-gesture-handler";
import { XStack, YStack } from "tamagui";

const DOT_SIZE = 6;

const INACTIVE_DOT_OPACITY = 0.4;

const SCROLL_EVENT_THROTTLE = 16;

export type PagedPhotosHandle = {
  scrollToOffset: (params: { offset: number; animated?: boolean }) => void;
  settle: () => void;
};

export function PagedPhotos({
  photos,
  itemWidth,
  index,
  ref,
  renderPhoto,
  onIndexChange,
}: {
  photos: string[];
  itemWidth: number;
  index: number;
  ref?: RefObject<PagedPhotosHandle | null>;
  renderPhoto: (photo: string, photoIndex: number) => ReactElement;
  onIndexChange: (index: number) => void;
}) {
  const listRef = useRef<FlatList<string>>(null);
  const offsetRef = useRef(index * itemWidth);
  const animatingRef = useRef(false);

  // 핀치나 확대 팬이 터치를 가져가면 네이티브 스크롤이 드래그 도중 취소되고, 페이지 정렬은
  // 손을 정상적으로 뗐을 때만 실행되므로 옆 사진 조각이 남는다. 취소는 JS에 알려지지 않아서
  // 제스처가 끝난 뒤 오프셋을 직접 보고 가장 가까운 페이지로 되돌린다.
  useImperativeHandle(ref, () => ({
    scrollToOffset: (params) => {
      animatingRef.current = params.animated === true;
      listRef.current?.scrollToOffset(params);
    },
    settle: () => {
      if (animatingRef.current) {
        return;
      }

      const next = Math.round(offsetRef.current / itemWidth);

      if (next * itemWidth === offsetRef.current) {
        return;
      }

      animatingRef.current = true;
      listRef.current?.scrollToOffset({
        offset: next * itemWidth,
        animated: true,
      });

      if (next !== index) {
        onIndexChange(next);
      }
    },
  }));

  return (
    <FlatList
      ref={listRef}
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
      scrollEventThrottle={SCROLL_EVENT_THROTTLE}
      onScroll={(event) => {
        offsetRef.current = event.nativeEvent.contentOffset.x;
      }}
      onScrollBeginDrag={() => {
        animatingRef.current = false;
      }}
      onMomentumScrollEnd={(event) => {
        animatingRef.current = false;

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
          bg="white"
          opacity={dotIndex === index ? 1 : INACTIVE_DOT_OPACITY}
        />
      ))}
    </XStack>
  );
}
