import type { ChatMessageResponse } from "@/lib/api";
import {
  formatUnreadCount,
  isSingleEmoji,
  mediaSummary,
  replySummary,
  toBulkChunks,
  toChatRows,
} from "@/lib/chat";

function message(
  messageId: number,
  senderId: number,
  createdAt: string,
): ChatMessageResponse {
  return {
    messageId,
    roomId: 1,
    senderId,
    type: "TEXT",
    content: "hi",
    createdAt,
    replyMessage: null,
    reactions: [],
  };
}

describe("isSingleEmoji", () => {
  it.each(["😀", "👍🏽", "👨‍👩‍👧", "🇰🇷", "1️⃣", "❤️", "☺"])(
    "%s 하나면 참이다",
    (text) => {
      expect(isSingleEmoji(text)).toBe(true);
    },
  );

  it.each(["😀😀", "a", "ㅋ", "👍 ", "", "😀a"])(
    "%j 는 거짓이다",
    (text) => {
      expect(isSingleEmoji(text)).toBe(false);
    },
  );
});

describe("replySummary", () => {
  it("내용이 있으면 내용을 준다", () => {
    expect(replySummary({ type: "TEXT", content: "안녕" })).toBe("안녕");
  });

  it("내용이 없으면 사진과 동영상을 구분한다", () => {
    expect(replySummary({ type: "PHOTO", content: null })).toBe("사진");
    expect(replySummary({ type: "VIDEO", content: null })).toBe("동영상");
    expect(mediaSummary("PHOTO")).toBe("사진");
  });
});

describe("formatUnreadCount", () => {
  it("99를 넘으면 99+로 줄인다", () => {
    expect(formatUnreadCount(5)).toBe("5");
    expect(formatUnreadCount(99)).toBe("99");
    expect(formatUnreadCount(100)).toBe("99+");
  });
});

describe("toBulkChunks", () => {
  it("500개 단위로 나눈다", () => {
    const ids = Array.from({ length: 1001 }, (_, index) => index);

    expect(toBulkChunks(ids).map((chunk) => chunk.length)).toEqual([
      500, 500, 1,
    ]);
    expect(toBulkChunks([])).toEqual([]);
  });
});

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
