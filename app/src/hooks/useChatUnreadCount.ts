import { useQuery } from "@tanstack/react-query";

import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth/store";

export const CHAT_UNREAD_COUNT_KEY = [...CHAT_ROOMS_KEY, "unreadCount"];

export function useChatUnreadCount() {
  const status = useAuthStore((state) => state.status);

  const { data } = useQuery({
    enabled: status === "authenticated",
    queryKey: CHAT_UNREAD_COUNT_KEY,
    queryFn: api.chats.unreadCount,
  });

  return data ?? 0;
}
