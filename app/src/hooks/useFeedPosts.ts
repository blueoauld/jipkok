import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import { api, type FeedPostPage, type FeedSort } from "@/lib/api";
import { toDateParam } from "@/lib/date";
import { useFlatItems } from "@/lib/paging";

export const FEEDS_KEY = ["feeds"];

export function feedPostsKey(date: Date, sort: FeedSort) {
  return [...FEEDS_KEY, toDateParam(date), sort];
}

export function useFeedPosts(date: Date, sort: FeedSort) {
  const query = useInfiniteQuery({
    queryKey: feedPostsKey(date, sort),
    queryFn: ({ pageParam }) =>
      api.feeds.list({
        date: toDateParam(date),
        sort,
        cursor: pageParam,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page: FeedPostPage) => page.nextCursor,
    placeholderData: keepPreviousData,
  });

  const posts = useFlatItems(query.data);

  return { ...query, posts };
}
