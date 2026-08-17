import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  api,
  type Gender,
  type MemberListPage,
  type MemberSort,
} from "@/lib/api";

export const MEMBER_FEED_KEY = ["members", "list"];

export function memberFeedKey(sort: MemberSort, gender: Gender | null) {
  return [...MEMBER_FEED_KEY, sort, gender ?? "ALL"];
}

export function useMemberFeed(sort: MemberSort, gender: Gender | null) {
  const query = useInfiniteQuery({
    queryKey: memberFeedKey(sort, gender),
    queryFn: ({ pageParam }) =>
      api.members.list({
        sort,
        gender: gender ?? undefined,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page: MemberListPage) => page.nextCursor,
    placeholderData: keepPreviousData,
  });

  const members = useMemo(
    () => query.data?.pages.flatMap((page) => page.items),
    [query.data],
  );

  return { ...query, members };
}
