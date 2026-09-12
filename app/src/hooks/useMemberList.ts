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

      queryClient.setQueryData<Page>(queryKey, (current) =>
        mapPages(current, (items) =>
          items.filter((item) => item.memberId !== memberId),
        ),
      );
    },
    onSuccess: (_data, memberId) =>
      queryClient.invalidateQueries({ queryKey: memberDetailKey(memberId) }),
    // 목록 전체를 스냅샷으로 되돌리면 그 사이 성공한 다른 삭제까지 되살아난다.
    // 실패는 드물므로 서버에서 다시 받아 맞춘다. 성공 경로에는 요청이 늘지 않는다.
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey });
      onError(error);
    },
  });
}
