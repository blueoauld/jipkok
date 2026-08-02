import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export function chatRoomKey(roomId: number) {
  return ["chats", "room", roomId];
}

// 사라진 방은 다시 물어봐야 404만 받으므로 조회를 멈춘다.
export function useChatRoom(roomId: number, enabled: boolean) {
  return useQuery({
    enabled,
    queryKey: chatRoomKey(roomId),
    queryFn: () => api.chats.get(roomId),
  });
}
