import { chatMessage } from "@/lib/__tests__/chat-fixtures";
import { toChatRows } from "@/lib/chat/rows";

function message(messageId: number, senderId: number, createdAt: string) {
  return chatMessage(messageId, { senderId, createdAt });
}

describe("toChatRows", () => {
  it("같은 사람이 같은 분에 보낸 메시지는 묶고 마지막에만 시간을 보인다", () => {
    const rows = toChatRows([
      message(3, 1, "2026-08-18T10:00:50Z"),
      message(2, 1, "2026-08-18T10:00:10Z"),
      message(1, 2, "2026-08-18T09:59:00Z"),
    ]);
    const messages = rows.filter((row) => row.kind === "message");

    expect(messages.map((row) => row.grouped)).toEqual([true, false, false]);
    expect(messages.map((row) => row.showTime)).toEqual([true, false, true]);
  });

  it("날짜가 바뀌는 자리와 가장 오래된 메시지 뒤에 날짜 행을 넣는다", () => {
    const rows = toChatRows([
      message(2, 1, "2026-08-18T01:00:00Z"),
      message(1, 1, "2026-08-16T23:00:00Z"),
    ]);

    expect(rows.map((row) => row.kind)).toEqual([
      "message",
      "day",
      "message",
      "day",
    ]);
  });

  it("행 키는 clientMessageId를 우선한다", () => {
    const rows = toChatRows([
      { ...message(1, 1, "2026-08-18T01:00:00Z"), clientMessageId: "c-1" },
    ]);

    expect(rows[0].key).toBe("c-1");
  });
});
