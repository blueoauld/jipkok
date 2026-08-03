import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth/store";
import { setBadgeCount } from "@/lib/push/notifications";

export const CHAT_UNREAD_COUNT_KEY = [...CHAT_ROOMS_KEY, "unreadCount"];

export function useChatUnreadCount() {
  const status = useAuthStore((state) => state.status);

  const { data } = useQuery({
    enabled: status === "authenticated",
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
