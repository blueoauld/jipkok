import type { ChatMessageResponse } from "@/lib/api";
import { isSameDay } from "@/lib/date";

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
  return isSameDay(new Date(a.createdAt), new Date(b.createdAt));
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
