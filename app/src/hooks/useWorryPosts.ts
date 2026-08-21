import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import { api, type WorryPostPage, type WorrySort } from "@/lib/api";
import { useFlatItems } from "@/lib/paging";

export const WORRIES_KEY = ["worries"];

// 목록과 검색이 함께 무효화되도록 둘 다 이 키 아래에 둔다.
export const WORRY_LIST_KEY = [...WORRIES_KEY, "list"];

export function worryPostsKey(sort: WorrySort) {
  return [...WORRY_LIST_KEY, sort];
}

export function worryDetailKey(postId: number) {
  return [...WORRIES_KEY, "detail", postId];
}

export function useWorryPosts(sort: WorrySort) {
  const query = useInfiniteQuery({
    queryKey: worryPostsKey(sort),
    queryFn: ({ pageParam }) => api.worries.list({ sort, cursor: pageParam }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page: WorryPostPage) => page.nextCursor,
    placeholderData: keepPreviousData,
  });

  const posts = useFlatItems(query.data);

  return { ...query, posts };
}
