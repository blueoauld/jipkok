import { useInfiniteQuery } from "@tanstack/react-query";

import { api, type FeedPostPage, type Gender } from "@/lib/api";
import { toDateParam } from "@/lib/date";

export function feedPostsKey(date: Date, gender: Gender | null) {
  return ["feeds", toDateParam(date), gender ?? "ALL"];
}

export function useFeedPosts(date: Date, gender: Gender | null) {
  const query = useInfiniteQuery({
    queryKey: feedPostsKey(date, gender),
    queryFn: ({ pageParam }) =>
      api.feeds.list({
        date: toDateParam(date),
        gender: gender ?? undefined,
        cursor: pageParam,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page: FeedPostPage) => page.nextCursor,
  });

  return {
    ...query,
    posts: query.data?.pages.flatMap((page) => page.items),
  };
}
