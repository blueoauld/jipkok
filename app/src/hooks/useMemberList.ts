import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";

import { alertApiError } from "@/lib/alert";
import type { MemberSummaryPage } from "@/lib/api";

type Page = InfiniteData<MemberSummaryPage>;

type Fetcher = (params: { cursor?: number }) => Promise<MemberSummaryPage>;

export function useMemberList(queryKey: string[], fetcher: Fetcher) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetcher({ cursor: pageParam }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page: MemberSummaryPage) => page.nextCursor,
  });

  return {
    ...query,
    members: query.data?.pages.flatMap((page) => page.items),
  };
}

export function useRemoveFromMemberList(
  queryKey: string[],
  remove: (memberId: number) => Promise<void>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: remove,
    onMutate: async (memberId: number) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Page>(queryKey);

      queryClient.setQueryData<Page>(
        queryKey,
        (current) =>
          current && {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              items: page.items.filter((item) => item.memberId !== memberId),
            })),
          },
      );

      return { previous };
    },
    onError: (error, _memberId, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
      alertApiError(error);
    },
  });
}
