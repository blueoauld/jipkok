import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import { WORRY_LIST_KEY } from "@/hooks/useWorryPosts";
import { api, type WorryPostPage } from "@/lib/api";
import { useFlatItems } from "@/lib/paging";

export const MIN_KEYWORD_LENGTH = 2;

// 서버가 앞뒤 공백을 지우고 찾으므로 길이도 지운 뒤로 센다.
export function useWorrySearch(rawKeyword: string) {
  const keyword = rawKeyword.trim();
  const enabled = keyword.length >= MIN_KEYWORD_LENGTH;

  const query = useInfiniteQuery({
    enabled,
    queryKey: [...WORRY_LIST_KEY, "search", keyword],
    queryFn: ({ pageParam }) =>
      api.worries.search({ keyword, cursor: pageParam }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page: WorryPostPage) => page.nextCursor,
    placeholderData: keepPreviousData,
  });

  const posts = useFlatItems(enabled ? query.data : undefined) ?? [];

  return { ...query, enabled, posts };
}
