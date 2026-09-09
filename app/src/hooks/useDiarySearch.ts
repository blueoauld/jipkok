import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import { DIARIES_KEY } from "@/hooks/useDiaries";
import { api, type DiaryPage } from "@/lib/api";
import { useFlatItems } from "@/lib/paging";
import { MIN_KEYWORD_LENGTH } from "@/lib/validation";

// 서버가 앞뒤 공백을 지우고 찾으므로 길이도 지운 뒤로 센다.
export function useDiarySearch(rawKeyword: string) {
  const keyword = rawKeyword.trim();
  const enabled = keyword.length >= MIN_KEYWORD_LENGTH;

  const query = useInfiniteQuery({
    enabled,
    queryKey: [...DIARIES_KEY, "search", keyword],
    queryFn: ({ pageParam }) =>
      api.diaries.search({ keyword, cursor: pageParam }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page: DiaryPage) => page.nextCursor,
    placeholderData: keepPreviousData,
  });

  const diaries = useFlatItems(enabled ? query.data : undefined) ?? [];

  return { ...query, enabled, diaries };
}
