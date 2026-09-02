import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { CHATS_KEY } from "@/lib/chat";

export function chatRoomKey(roomId: number) {
  return [...CHATS_KEY, "room", roomId];
}

export function useChatRoom(roomId: number, enabled = true) {
  return useQuery({
    enabled,
    queryKey: chatRoomKey(roomId),
    queryFn: () => api.chats.get(roomId),
  });
}
