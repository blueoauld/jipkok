import { useInfiniteQuery } from "@tanstack/react-query";

import { WORRIES_KEY } from "@/hooks/useWorryPosts";
import { api, type WorryCommentPage } from "@/lib/api";
import { useFlatItems } from "@/lib/paging";

export function worryCommentsKey(postId: number) {
  return [...WORRIES_KEY, "comments", postId];
}

export function useWorryComments(postId: number) {
  const query = useInfiniteQuery({
    queryKey: worryCommentsKey(postId),
    queryFn: ({ pageParam }) =>
      api.worries.comments(postId, { cursor: pageParam }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page: WorryCommentPage) => page.nextCursor,
  });

  const comments = useFlatItems(query.data);

  return { ...query, comments };
}
