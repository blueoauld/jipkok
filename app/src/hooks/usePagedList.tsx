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

export function usePagedList({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: PagedQuery) {
  const contentContainerStyle = useMemo(() => {
    const space = getTokens().space;

    return {
      paddingTop: space.$2.val,
      paddingBottom: space.$4.val,
      paddingHorizontal: space.$4.val,
      gap: space.$4.val,
    };
  }, []);

  return {
    contentContainerStyle,
    onEndReachedThreshold: END_REACHED_THRESHOLD,
    onEndReached: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    ListFooterComponent: isFetchingNextPage ? <FooterSpinner /> : null,
  };
}
