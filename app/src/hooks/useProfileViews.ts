import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";

import { api, type ProfileViewPage } from "@/lib/api";
import { useFlatItems } from "@/lib/paging";

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

  const views = useFlatItems(query.data);

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

  // 전역 기본값은 즉시 실패지만 이건 멈춰 뒀다 연결되면 보낸다. 화면에 아무것도 띄우지
  // 않는 뒷일이고, 실패하면 새 프로필 조회 배지가 서버에 남아 계속 다시 뜬다.
  const markSeen = useMutation({
    mutationFn: api.profileViews.markSeen,
    networkMode: "online",
    onSuccess: () => queryClient.setQueryData(PROFILE_VIEW_NEW_COUNT_KEY, 0),
  });

  const { mutate } = markSeen;

  useEffect(() => {
    if (enabled) {
      mutate();
    }
  }, [enabled, mutate]);
}
