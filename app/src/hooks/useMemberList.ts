import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { memberDetailKey } from "@/hooks/useMemberDetail";
import type { MemberSummaryPage, MemberSummaryResponse } from "@/lib/api";
import { mapPages, useFlatItems } from "@/lib/paging";

type Page = InfiniteData<MemberSummaryPage>;

export type RelationKind = "likes" | "favorites" | "blocks" | "secretPhotos";

export function relationKey(kind: RelationKind) {
  return [kind];
}

export function relationListKey(
  kind: RelationKind,
  scope: "mine" | "received" | "granted",
) {
  return [...relationKey(kind), scope];
}

export type MemberListFetcher = (params: {
  cursor?: number;
}) => Promise<MemberSummaryPage>;

export type MemberListQuery = {
  members?: MemberSummaryResponse[];
  error: unknown;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => unknown;
  refetch: () => unknown;
};

export function useMemberList(queryKey: string[], fetcher: MemberListFetcher) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetcher({ cursor: pageParam }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page: MemberSummaryPage) => page.nextCursor,
  });

  const members = useFlatItems(query.data);

  return { ...query, members };
}

function findInPages(data: Page | undefined, memberId: number) {
  for (const [page, { items }] of (data?.pages ?? []).entries()) {
    const index = items.findIndex((item) => item.memberId === memberId);

    if (index >= 0) {
      return { page, index, member: items[index] };
    }
  }

  return undefined;
}

export function useRemoveFromMemberList(
  queryKey: string[],
  remove: (memberId: number) => Promise<void>,
  onError: (error: unknown) => void,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: remove,
    onMutate: async (memberId: number) => {
      await queryClient.cancelQueries({ queryKey });

      const removed = findInPages(
        queryClient.getQueryData<Page>(queryKey),
        memberId,
      );

      queryClient.setQueryData<Page>(queryKey, (current) =>
        mapPages(current, (items) =>
          items.filter((item) => item.memberId !== memberId),
        ),
      );

      return removed;
    },
    onSuccess: (_data, memberId) =>
      queryClient.invalidateQueries({ queryKey: memberDetailKey(memberId) }),
    // 목록 전체를 스냅샷으로 되돌리면 그 사이 성공한 다른 삭제까지 되살아난다. 끊긴 채로
    // 실패했으면 쿼리가 멈춰 다시 받지도 못하므로, 지운 한 명만 제자리에 도로 끼운다.
    onError: (error, _memberId, removed) => {
      if (removed) {
        queryClient.setQueryData<Page>(queryKey, (current) =>
          mapPages(current, (items, page) =>
            page === removed.page
              ? [
                  ...items.slice(0, removed.index),
                  removed.member,
                  ...items.slice(removed.index),
                ]
              : items,
          ),
        );
      }

      onError(error);
    },
  });
}
