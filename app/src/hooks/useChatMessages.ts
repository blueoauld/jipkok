import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { api, type ChatMessagePage } from "@/lib/api";

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

  const messages = useMemo(
    () => query.data?.pages.flatMap((page) => page.items),
    [query.data],
  );

  return { ...query, messages };
}
