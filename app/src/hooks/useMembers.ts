import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import { api, type MemberListPage, type MemberSort } from "@/lib/api";
import { DEFAULT_MEMBER_FILTER, type MemberFilter } from "@/lib/filter/store";
import { useFlatItems } from "@/lib/paging";

export const MEMBERS_KEY = ["members", "list"];

export function membersKey(sort: MemberSort, filter: MemberFilter) {
  return [
    ...MEMBERS_KEY,
    sort,
    filter.gender ?? "ALL",
    filter.minAge,
    filter.maxAge,
  ];
}

export function useMembers(sort: MemberSort, filter: MemberFilter) {
  const query = useInfiniteQuery({
    queryKey: membersKey(sort, filter),
    queryFn: ({ pageParam }) =>
      api.members.list({
        sort,
        gender: filter.gender ?? undefined,
        minAge:
          filter.minAge === DEFAULT_MEMBER_FILTER.minAge
            ? undefined
            : filter.minAge,
        maxAge:
          filter.maxAge === DEFAULT_MEMBER_FILTER.maxAge
            ? undefined
            : filter.maxAge,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page: MemberListPage) => page.nextCursor,
    placeholderData: keepPreviousData,
  });

  const members = useFlatItems(query.data);

  return { ...query, members };
}
