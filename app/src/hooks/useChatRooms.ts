import { useInfiniteQuery } from "@tanstack/react-query";

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

  return {
    ...query,
    rooms: query.data?.pages.flatMap((page) => page.items),
  };
}
