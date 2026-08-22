import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import {
  api,
  type WorryCategory,
  type WorryPostPage,
  type WorrySort,
} from "@/lib/api";
import { useFlatItems } from "@/lib/paging";

export const WORRIES_KEY = ["worries"];

// 목록과 검색이 함께 무효화되도록 둘 다 이 키 아래에 둔다.
export const WORRY_LIST_KEY = [...WORRIES_KEY, "list"];

function worryPostsKey(sort: WorrySort, category: WorryCategory | null) {
  return [...WORRY_LIST_KEY, sort, category];
}

export function worryDetailKey(postId: number) {
  return [...WORRIES_KEY, "detail", postId];
}

const MY_WORRIES_KEY = [...WORRY_LIST_KEY, "mine"];

export function useMyWorryPosts() {
  const query = useInfiniteQuery({
    queryKey: MY_WORRIES_KEY,
    queryFn: ({ pageParam }) => api.worries.mine({ cursor: pageParam }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page: WorryPostPage) => page.nextCursor,
  });

  const posts = useFlatItems(query.data);

  return { ...query, posts };
}

export function useWorryPosts(sort: WorrySort, category: WorryCategory | null) {
  const query = useInfiniteQuery({
    queryKey: worryPostsKey(sort, category),
    queryFn: ({ pageParam }) =>
      api.worries.list({
        sort,
        category: category ?? undefined,
        cursor: pageParam,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page: WorryPostPage) => page.nextCursor,
    placeholderData: keepPreviousData,
  });

  const posts = useFlatItems(query.data);

  return { ...query, posts };
}
