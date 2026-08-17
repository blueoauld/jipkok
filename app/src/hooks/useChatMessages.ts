import { useInfiniteQuery } from "@tanstack/react-query";

import { api, type ChatMessagePage } from "@/lib/api";
import { useFlatItems } from "@/lib/paging";

export function chatMessagesKey(roomId: number) {
  return ["chats", "messages", roomId];
}

export function useChatMessages(roomId: number, enabled = true) {
  const query = useInfiniteQuery({
    enabled,
    queryKey: chatMessagesKey(roomId),
    queryFn: ({ pageParam }) =>
      api.chats.messages(roomId, { cursor: pageParam }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page: ChatMessagePage) => page.nextCursor,
  });

  const messages = useFlatItems(query.data);

  return { ...query, messages };
}
