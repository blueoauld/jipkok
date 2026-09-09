import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import { api, type MemberListPage } from "@/lib/api";
import {
  DEFAULT_MEMBER_FILTER,
  type MemberFilter,
  type MemberListSort,
} from "@/lib/filter/store";
import { useFlatItems } from "@/lib/paging";

export const MEMBERS_KEY = ["members", "list"];

function membersKey(sort: MemberListSort, filter: MemberFilter) {
  return [
    ...MEMBERS_KEY,
    sort,
    filter.gender ?? "ALL",
    filter.minAge,
    filter.maxAge,
  ];
}

function toQuery(filter: MemberFilter) {
  return {
    gender: filter.gender ?? undefined,
    minAge:
      filter.minAge === DEFAULT_MEMBER_FILTER.minAge
        ? undefined
        : filter.minAge,
    maxAge:
      filter.maxAge === DEFAULT_MEMBER_FILTER.maxAge
        ? undefined
        : filter.maxAge,
  };
}

export function useMembers(sort: MemberListSort, filter: MemberFilter) {
  const query = useInfiniteQuery({
    queryKey: membersKey(sort, filter),
    queryFn: ({ pageParam }) =>
      sort === "RANK"
        ? api.members.ranking({ ...toQuery(filter), cursor: pageParam })
        : api.members.list({ sort, ...toQuery(filter), cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page: MemberListPage) => page.nextCursor,
    placeholderData: keepPreviousData,
  });

  const members = useFlatItems(query.data);

  return { ...query, members };
}
