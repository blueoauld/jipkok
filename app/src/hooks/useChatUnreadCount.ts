import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export const CHAT_UNREAD_COUNT_KEY = ["chats", "unread-count"];

export function useChatUnreadCount() {
  const { data } = useQuery({
    queryKey: CHAT_UNREAD_COUNT_KEY,
    queryFn: api.chats.unreadCount,
  });

  return data ?? 0;
}
