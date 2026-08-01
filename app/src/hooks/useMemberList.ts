import { useInfiniteQuery } from "@tanstack/react-query";

import type { MemberSummaryPage } from "@/lib/api";

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
