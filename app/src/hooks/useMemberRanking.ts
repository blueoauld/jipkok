import { useInfiniteQuery } from "@tanstack/react-query";

import { api, type Gender, type MemberSearchPage } from "@/lib/api";

export function useMemberRanking(gender: Gender | null) {
  const query = useInfiniteQuery({
    queryKey: ["members", "ranking", gender ?? "ALL"],
    queryFn: ({ pageParam }) =>
      api.members.ranking({ gender: gender ?? undefined, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page: MemberSearchPage) => page.nextCursor,
  });

  return {
    ...query,
    members: query.data?.pages.flatMap((page) => page.items),
  };
}
