import { type QueryClient, useQuery } from "@tanstack/react-query";

import { chatMessagesKey } from "@/hooks/useChatMessages";
import { chatMediaKey } from "@/hooks/useChatRoomMedia";
import { api } from "@/lib/api";
import { CHATS_KEY } from "@/lib/chat";
import { clearChatDraft } from "@/lib/chat/draft-store";

export function chatRoomKey(roomId: number) {
  return [...CHATS_KEY, "room", roomId];
}

// 나가거나 지워진 방의 흔적(방, 메시지, 미디어 캐시, 초안)을 한 번에 거둔다.
export function removeRoomQueries(queryClient: QueryClient, roomId: number) {
  queryClient.removeQueries({ queryKey: chatRoomKey(roomId) });
  queryClient.removeQueries({ queryKey: chatMessagesKey(roomId) });
  queryClient.removeQueries({ queryKey: chatMediaKey(roomId) });
  clearChatDraft(roomId);
}

export function useChatRoom(roomId: number, enabled = true) {
  return useQuery({
    enabled,
    queryKey: chatRoomKey(roomId),
    queryFn: () => api.chats.get(roomId),
  });
}
