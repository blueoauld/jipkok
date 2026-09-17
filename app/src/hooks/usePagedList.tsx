import { useMemo } from "react";
import { Spinner, YStack } from "tamagui";

import { ErrorState } from "@/components/ui/ErrorState";
import { LIST_ROW_EVEN_PADDING_Y, SCREEN_PADDING } from "@/lib/design";
import { listErrorMessage } from "@/lib/message";

const END_REACHED_THRESHOLD = 0.5;

type PagedQuery = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  fetchNextPage: () => unknown;
};

function FooterSpinner() {
  return (
    <YStack items="center" py="$4">
      <Spinner size="small" />
    </YStack>
  );
}

function FooterError({ onRetry }: { onRetry: () => void }) {
  return (
    <YStack py="$4">
      <ErrorState message={listErrorMessage()} onRetry={onRetry} />
    </YStack>
  );
}

function footerFor({
  fetching,
  failed,
  onRetry,
}: {
  fetching: boolean;
  failed: boolean;
  onRetry: () => void;
}) {
  if (fetching) {
    return <FooterSpinner />;
  }

  if (failed) {
    return <FooterError onRetry={onRetry} />;
  }

  return null;
}

export function usePagedList(
  {
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  }: PagedQuery,
  bottomInset = 0,
  layout?: "cards" | "rows",
) {
  const contentContainerStyle = useMemo(() => {
    // 행은 좌우 여백과 누름 면을 스스로 가지므로 목록에는 간격을 두지 않는다. 아래만 행 위아래 여백 하나를
    // 더해 마지막 행 아래가 행 사이와 같게 한다.
    if (layout === "rows") {
      return { paddingBottom: LIST_ROW_EVEN_PADDING_Y + bottomInset };
    }

    // 카드 바깥은 좌우, 위아래, 카드 사이를 모두 화면 좌우 여백만큼 띄운다.
    if (layout === "cards") {
      return {
        paddingTop: SCREEN_PADDING,
        paddingBottom: SCREEN_PADDING + bottomInset,
        paddingHorizontal: SCREEN_PADDING,
        gap: SCREEN_PADDING,
      };
    }

    // 채팅 미디어 격자처럼 모양을 주지 않는 목록은 부르는 쪽이 여백을 직접 둔다.
    return undefined;
  }, [bottomInset, layout]);

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
    // 실패해도 hasNextPage와 isFetchingNextPage는 원래대로 돌아오므로, 끝에 머무는
    // 동안 같은 장을 끝없이 다시 받는다. 다시 받아 성공하면 이 값이 저절로 풀린다.
    onEndReached: () => {
      if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) {
        fetchNextPage();
      }
    },
    ListFooterComponent: footerFor({
      fetching: isFetchingNextPage,
      failed: isFetchNextPageError,
      onRetry: fetchNextPage,
    }),
  };
}
