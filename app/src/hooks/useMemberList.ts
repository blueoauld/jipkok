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
      const previous = queryClient.getQueryData<Page>(queryKey);

      queryClient.setQueryData<Page>(queryKey, (current) =>
        mapPages(current, (items) =>
          items.filter((item) => item.memberId !== memberId),
        ),
      );

      return { previous };
    },
    onSuccess: (_data, memberId) =>
      queryClient.invalidateQueries({ queryKey: memberDetailKey(memberId) }),
    onError: (error, _memberId, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
      onError(error);
    },
  });
}
