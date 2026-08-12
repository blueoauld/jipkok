import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export function chatRoomKey(roomId: number) {
  return ["chats", "room", roomId];
}

export function useChatRoom(roomId: number) {
  return useQuery({
    queryKey: chatRoomKey(roomId),
    queryFn: () => api.chats.get(roomId),
  });
}
