import { useInfiniteQuery } from "@tanstack/react-query";

import { api, type ChatRoomPage } from "@/lib/api";

export const CHAT_ROOMS_KEY = ["chats", "rooms"];

export function useChatRooms() {
  const query = useInfiniteQuery({
    queryKey: CHAT_ROOMS_KEY,
    queryFn: ({ pageParam }) => api.chats.list({ cursor: pageParam }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page: ChatRoomPage) => page.nextCursor,
  });

  return {
    ...query,
    rooms: query.data?.pages.flatMap((page) => page.items),
  };
}
