import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import {
  api,
  type Gender,
  type MemberListPage,
  type MemberSort,
} from "@/lib/api";

export function useMemberFeed(sort: MemberSort, gender: Gender | null) {
  const query = useInfiniteQuery({
    queryKey: ["members", sort, gender ?? "ALL"],
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

  return {
    ...query,
    members: query.data?.pages.flatMap((page) => page.items),
  };
}
