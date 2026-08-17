import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import { api, type MemberSearchPage } from "@/lib/api";
import { useFlatItems } from "@/lib/paging";

export const MIN_KEYWORD_LENGTH = 2;

// 서버가 앞뒤 공백을 지우고 찾으므로 길이도 지운 뒤로 센다.
export function useMemberSearch(rawKeyword: string) {
  const keyword = rawKeyword.trim();
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

  const members = useFlatItems(enabled ? query.data : undefined) ?? [];

  return { ...query, enabled, members };
}
