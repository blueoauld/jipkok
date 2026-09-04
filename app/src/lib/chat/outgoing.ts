import type { ChatMessageResponse, ChatRoomResponse } from "@/lib/api";
import { serverNow } from "@/lib/api/server-clock";

let lastTempId = 0;

function createClientMessageId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function createTemp(
  senderId: number,
  message: Pick<
    ChatMessageResponse,
    "type" | "content" | "imageUrl" | "replyMessage"
  > &
    Partial<
      Pick<ChatMessageResponse, "videoUrl" | "thumbnailUrl" | "durationSeconds">
    >,
  clientMessageId: string = createClientMessageId(),
): ChatMessageResponse {
  return {
    messageId: --lastTempId,
    roomId: 0,
    senderId,
    createdAt: serverNow().toISOString(),
    clientMessageId,
    reactions: [],
    ...message,
  };
}

export function raiseToSectionTop(items: ChatRoomResponse[], roomId: number) {
  const room = items.find((item) => item.roomId === roomId);

  if (!room) {
    return items;
  }

  const rest = items.filter((item) => item.roomId !== roomId);
  const at = room.pinned ? 0 : rest.filter((item) => item.pinned).length;

  return [...rest.slice(0, at), room, ...rest.slice(at)];
}
