import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import { api, type MemberSearchPage } from "@/lib/api";

export const MIN_KEYWORD_LENGTH = 2;

export function useMemberSearch(keyword: string) {
  const enabled = keyword.length >= MIN_KEYWORD_LENGTH;

  const query = useInfiniteQuery({
    enabled,
    queryKey: ["members", "search", keyword],
    queryFn: ({ pageParam }) =>
      api.members.search({ keyword, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page: MemberSearchPage) => page.nextCursor,
    placeholderData: keepPreviousData,
  });

  return {
    ...query,
    enabled,
    members: enabled ? query.data?.pages.flatMap((page) => page.items) : [],
  };
}
