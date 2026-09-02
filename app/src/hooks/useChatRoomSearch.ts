import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import { api, type ChatRoomPage } from "@/lib/api";
import { useFlatItems } from "@/lib/paging";

export function useChatRoomSearch(keyword: string) {
  const enabled = keyword.length > 0;

  const query = useInfiniteQuery({
    enabled,
    queryKey: [...CHAT_ROOMS_KEY, "search", keyword],
    queryFn: ({ pageParam }) =>
      api.chats.search({ keyword, cursor: pageParam }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page: ChatRoomPage) => page.nextCursor,
    placeholderData: keepPreviousData,
  });

  const rooms = useFlatItems(enabled ? query.data : undefined) ?? [];

  return { ...query, enabled, rooms };
}
