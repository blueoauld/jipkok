import type { ChatMessageResponse, ReplyMessageResponse } from "@/lib/api";

export const LEAVE_DESCRIPTION =
  "나가면 주고받은 대화 내역이 서로에게서 모두 사라집니다.";

const PHOTO_SUMMARY = "사진";

const MAX_UNREAD_COUNT = 99;

export function formatUnreadCount(count: number) {
  return count > MAX_UNREAD_COUNT ? `${MAX_UNREAD_COUNT}+` : `${count}`;
}

export function replySummary(reply: ReplyMessageResponse) {
  return reply.content || PHOTO_SUMMARY;
}

export function toReply(message: ChatMessageResponse): ReplyMessageResponse {
  return {
    messageId: message.messageId,
    senderId: message.senderId,
    type: message.type,
    content: message.content ?? null,
    imageUrl: message.imageUrl ?? null,
  };
}

export function isPending(message: ChatMessageResponse) {
  return message.messageId < 0;
}

export type ChatRow =
  | {
      kind: "message";
      key: string;
      message: ChatMessageResponse;
      grouped: boolean;
      showTime: boolean;
    }
  | { kind: "day"; key: string; date: Date };

function displayMinute(createdAt: string) {
  return Math.floor(new Date(createdAt).getTime() / 60_000);
}

function sameGroup(a: ChatMessageResponse, b: ChatMessageResponse) {
  return (
    a.senderId === b.senderId &&
    displayMinute(a.createdAt) === displayMinute(b.createdAt)
  );
}

function sameDay(a: ChatMessageResponse, b: ChatMessageResponse) {
  return (
    new Date(a.createdAt).toDateString() === new Date(b.createdAt).toDateString()
  );
}

export function toChatRows(messages: ChatMessageResponse[]) {
  const rows: ChatRow[] = [];

  messages.forEach((message, index) => {
    const older = messages[index + 1];
    const newer = messages[index - 1];

    rows.push({
      kind: "message",
      key: message.clientMessageId ?? String(message.messageId),
      message,
      grouped: !!older && sameGroup(older, message),
      showTime: !newer || !sameGroup(newer, message),
    });

    if (!older || !sameDay(older, message)) {
      rows.push({
        kind: "day",
        key: `day-${message.messageId}`,
        date: new Date(message.createdAt),
      });
    }
  });

  return rows;
}
