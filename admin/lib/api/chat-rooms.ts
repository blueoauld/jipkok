import { api } from "@/lib/api/client";
import type { ChatRoomFilter } from "@/components/chat-rooms/chat-room-filters";
import type {
  ChatMessagePage,
  ChatRoomDetail,
  ChatRoomPage,
} from "@/lib/types";

export type ChatRoomListParams = ChatRoomFilter & { page: number };

export const fetchChatRooms = (params: ChatRoomListParams) =>
  api<ChatRoomPage>("/api/admin/chat-rooms", {
    query: {
      status: params.status === "ALL" ? undefined : params.status,
      memberId: params.memberId || undefined,
      page: params.page,
    },
  });

export const fetchChatRoom = (roomId: number) =>
  api<ChatRoomDetail>(`/api/admin/chat-rooms/${roomId}`);

export const fetchChatMessages = (roomId: number, cursor?: string) =>
  api<ChatMessagePage>(`/api/admin/chat-rooms/${roomId}/messages`, {
    query: { cursor },
  });
