import { useInfiniteQuery } from "@tanstack/react-query";

import { api, type ChatMessagePage } from "@/lib/api";
import { CHATS_KEY } from "@/lib/chat";
import { useFlatItems } from "@/lib/paging";

export function chatMediaKey(roomId: number) {
  return [...CHATS_KEY, "media", roomId];
}

// 방금 보낸 사진이 바로 보여야 하므로 들어올 때마다 다시 받는다.
export function useChatRoomMedia(roomId: number, enabled = true) {
  const query = useInfiniteQuery({
    enabled,
    queryKey: chatMediaKey(roomId),
    queryFn: ({ pageParam }) => api.chats.media(roomId, { cursor: pageParam }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page: ChatMessagePage) => page.nextCursor,
    staleTime: 0,
  });

  const messages = useFlatItems(query.data);

  return { ...query, messages };
}
