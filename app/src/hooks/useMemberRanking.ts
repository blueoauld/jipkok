import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import { api, type Gender, type MemberSearchPage } from "@/lib/api";
import { useFlatItems } from "@/lib/paging";

export function useMemberRanking(gender: Gender | null) {
  const query = useInfiniteQuery({
    queryKey: ["members", "ranking", gender ?? "ALL"],
    queryFn: ({ pageParam }) =>
      api.members.ranking({ gender: gender ?? undefined, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page: MemberSearchPage) => page.nextCursor,
    placeholderData: keepPreviousData,
  });

  const members = useFlatItems(query.data);

  return { ...query, members };
}
