import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import { api, type ProfileViewPage } from "@/lib/api";

const PROFILE_VIEWS_KEY = ["profileViews"];
const PROFILE_VIEW_NEW_COUNT_KEY = ["profileViews", "newCount"];

export function useProfileViews() {
  const query = useInfiniteQuery({
    queryKey: PROFILE_VIEWS_KEY,
    queryFn: ({ pageParam }) =>
      api.profileViews.received({ cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page: ProfileViewPage) => page.nextCursor,
  });

  const views = useMemo(
    () => query.data?.pages.flatMap((page) => page.items),
    [query.data],
  );

  return { ...query, views };
}

export function useProfileViewNewCount() {
  const { data } = useQuery({
    queryKey: PROFILE_VIEW_NEW_COUNT_KEY,
    queryFn: api.profileViews.newCount,
  });

  return data ?? 0;
}

export function useMarkProfileViewsSeen(enabled: boolean) {
  const queryClient = useQueryClient();

  const markSeen = useMutation({
    mutationFn: api.profileViews.markSeen,
    onSuccess: () => queryClient.setQueryData(PROFILE_VIEW_NEW_COUNT_KEY, 0),
  });

  const { mutate } = markSeen;

  useEffect(() => {
    if (enabled) {
      mutate();
    }
  }, [enabled, mutate]);
}
