import {
  keepPreviousData,
  type QueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";

import { CHAT_UNREAD_COUNT_KEY } from "@/hooks/useChatUnreadCount";
import { api, type ChatRoomPage } from "@/lib/api";
import { useFlatItems } from "@/lib/paging";

export const CHAT_ROOMS_KEY = ["chats", "rooms"];

export function invalidateChatLists(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY });
  queryClient.invalidateQueries({ queryKey: CHAT_UNREAD_COUNT_KEY });
}

export function useChatRooms(unreadOnly: boolean) {
  const query = useInfiniteQuery({
    queryKey: [...CHAT_ROOMS_KEY, unreadOnly],
    queryFn: ({ pageParam }) =>
      api.chats.list({ cursor: pageParam, unreadOnly }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page: ChatRoomPage) => page.nextCursor,
    placeholderData: keepPreviousData,
  });

  const rooms = useFlatItems(query.data);

  return { ...query, rooms };
}
