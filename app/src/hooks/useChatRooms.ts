import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { api, type ChatRoomPage } from "@/lib/api";

export const CHAT_ROOMS_KEY = ["chats", "rooms"];

export function useChatRooms(unreadOnly: boolean) {
  const query = useInfiniteQuery({
    queryKey: [...CHAT_ROOMS_KEY, unreadOnly],
    queryFn: ({ pageParam }) =>
      api.chats.list({ cursor: pageParam, unreadOnly }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page: ChatRoomPage) => page.nextCursor,
  });

  const rooms = useMemo(
    () => query.data?.pages.flatMap((page) => page.items),
    [query.data],
  );

  return { ...query, rooms };
}
