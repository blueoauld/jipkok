import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import {
  api,
  type Gender,
  type MemberListPage,
  type MemberSort,
} from "@/lib/api";
import { useFlatItems } from "@/lib/paging";

export const MEMBERS_KEY = ["members", "list"];

export function membersKey(sort: MemberSort, gender: Gender | null) {
  return [...MEMBERS_KEY, sort, gender ?? "ALL"];
}

export function useMembers(sort: MemberSort, gender: Gender | null) {
  const query = useInfiniteQuery({
    queryKey: membersKey(sort, gender),
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

  const members = useFlatItems(query.data);

  return { ...query, members };
}
