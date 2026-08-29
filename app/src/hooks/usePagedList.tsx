import { useMemo } from "react";
import { getTokens, Spinner, YStack } from "tamagui";

const END_REACHED_THRESHOLD = 0.5;

type PagedQuery = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => unknown;
};

function FooterSpinner() {
  return (
    <YStack items="center" py="$4">
      <Spinner size="small" />
    </YStack>
  );
}

export function usePagedList(
  { hasNextPage, isFetchingNextPage, fetchNextPage }: PagedQuery,
  bottomInset = 0,
) {
  const contentContainerStyle = useMemo(() => {
    const space = getTokens().space;

    return {
      paddingTop: space.$2.val,
      paddingBottom: space.$4.val + bottomInset,
      paddingHorizontal: space.$4.val,
      gap: space.$4.val,
    };
  }, [bottomInset]);

  // 내용만 비우면 스크롤 지시자가 그 여백까지 흘러내린다. 자동 보정은 안전 영역을 한 번
  // 더 더하므로 끄고 직접 잘라야 한다. iOS 전용 프롭인데 바가 내용을 덮는 것도 유리뿐이다.
  const indicatorProps = bottomInset
    ? {
        scrollIndicatorInsets: { bottom: bottomInset },
        automaticallyAdjustsScrollIndicatorInsets: false,
      }
    : null;

  return {
    contentContainerStyle,
    ...indicatorProps,
    onEndReachedThreshold: END_REACHED_THRESHOLD,
    onEndReached: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    ListFooterComponent: isFetchingNextPage ? <FooterSpinner /> : null,
  };
}
