import type { ChatMessageResponse, ChatRoomResponse } from "@/lib/api";

export function chatMessage(
  messageId: number,
  extra: Partial<ChatMessageResponse> = {},
): ChatMessageResponse {
  return {
    messageId,
    roomId: 1,
    senderId: 1,
    type: "TEXT",
    content: "hi",
    createdAt: "2026-08-18T00:00:00Z",
    replyMessage: null,
    reactions: [],
    ...extra,
  };
}

export function chatRoom(
  roomId: number,
  extra: Partial<ChatRoomResponse> = {},
): ChatRoomResponse {
  return {
    roomId,
    memberId: 2,
    nickname: "상대",
    lastMessageType: "TEXT",
    lastMessageContent: "hi",
    lastMessageAt: "2026-08-18T00:00:00Z",
    unreadCount: 0,
    notificationEnabled: true,
    pinned: false,
    ...extra,
  };
}
