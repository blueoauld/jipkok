import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { api } from "@/lib/api";
import { setBadgeCount } from "@/lib/push/notifications";

export const CHAT_UNREAD_COUNT_KEY = ["chats", "unread-count"];

export function useChatUnreadCount() {
  const { data } = useQuery({
    queryKey: CHAT_UNREAD_COUNT_KEY,
    queryFn: api.chats.unreadCount,
  });

  useEffect(() => {
    if (data !== undefined) {
      setBadgeCount(data);
    }
  }, [data]);

  return data ?? 0;
}
