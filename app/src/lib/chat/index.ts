import {
  type ChatMessageResponse,
  type ChatMessageType,
  isApiError,
  type ReplyMessageResponse,
} from "@/lib/api";
import i18n from "@/lib/i18n";

export const LEAVE_DESCRIPTION = i18n.t("component.leaveRoomNotice");

export const LEAVE_SELECTED_DESCRIPTION = i18n.t("component.leaveRoomsNotice");

const PHOTO_SUMMARY = i18n.t("media.photoSummary");
const VIDEO_SUMMARY = i18n.t("media.videoSummary");

export function mediaSummary(type: ChatMessageType) {
  return type === "VIDEO" ? VIDEO_SUMMARY : PHOTO_SUMMARY;
}

export const CHATS_KEY = ["chats"];

const CHAT_ROOM_NOT_FOUND_CODE = "CHAT_004";

// 상대가 나갔거나 차단으로 지워진 방이다. 소켓 이벤트를 놓쳤을 때 이 코드로 알게 된다.
export function isRoomNotFound(error: unknown) {
  return isApiError(error) && error.code === CHAT_ROOM_NOT_FOUND_CODE;
}

const BULK_CHUNK_SIZE = 500;

export function toBulkChunks(roomIds: number[]) {
  const chunks: number[][] = [];

  for (let index = 0; index < roomIds.length; index += BULK_CHUNK_SIZE) {
    chunks.push(roomIds.slice(index, index + BULK_CHUNK_SIZE));
  }

  return chunks;
}

const MAX_UNREAD_COUNT = 99;

export function formatUnreadCount(count: number) {
  return count > MAX_UNREAD_COUNT ? `${MAX_UNREAD_COUNT}+` : `${count}`;
}

// 답장 대상은 원본 메시지일 수도, 서버가 줄인 응답일 수도 있다.
export function replySummary(reply: {
  type: ChatMessageType;
  content?: string | null;
}) {
  return reply.content || mediaSummary(reply.type);
}

export function toReply(message: ChatMessageResponse): ReplyMessageResponse {
  return {
    messageId: message.messageId,
    senderId: message.senderId,
    type: message.type,
    content: message.content ?? null,
    previewUrl: message.imageUrl ?? message.thumbnailUrl ?? null,
  };
}

const SINGLE_EMOJI =
  /^(?:\p{Regional_Indicator}{2}|[0-9#*]\uFE0F?\u20E3|\p{Extended_Pictographic}(?:\p{Emoji_Modifier}|\uFE0F)?(?:\u200D\p{Extended_Pictographic}(?:\p{Emoji_Modifier}|\uFE0F)?)*)$/u;

export function isSingleEmoji(content: string) {
  return SINGLE_EMOJI.test(content);
}

export function isPending(message: ChatMessageResponse) {
  return message.messageId < 0;
}
