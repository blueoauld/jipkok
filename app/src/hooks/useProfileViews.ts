import { useInfiniteQuery } from "@tanstack/react-query";

import { api, type ProfileViewPage } from "@/lib/api";

export const PROFILE_VIEWS_KEY = ["profileViews"];

export function useProfileViews() {
  const query = useInfiniteQuery({
    queryKey: PROFILE_VIEWS_KEY,
    queryFn: ({ pageParam }) =>
      api.profileViews.received({ cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page: ProfileViewPage) => page.nextCursor,
  });

  return {
    ...query,
    members: query.data?.pages.flatMap((page) => page.items),
  };
}
