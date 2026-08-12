import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { api, type ChatRoomPage } from "@/lib/api";

export function useChatRoomSearch(keyword: string) {
  const enabled = keyword.length > 0;

  const query = useInfiniteQuery({
    enabled,
    queryKey: ["chats", "rooms", "search", keyword],
    queryFn: ({ pageParam }) =>
      api.chats.search({ keyword, cursor: pageParam }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page: ChatRoomPage) => page.nextCursor,
    placeholderData: keepPreviousData,
  });

  const rooms = useMemo(
    () => (enabled ? query.data?.pages.flatMap((page) => page.items) : []),
    [enabled, query.data],
  );

  return { ...query, enabled, rooms };
}
