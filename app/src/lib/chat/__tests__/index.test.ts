import {
  formatUnreadCount,
  isSingleEmoji,
  mediaSummary,
  replySummary,
  toBulkChunks,
} from "@/lib/chat";

describe("isSingleEmoji", () => {
  it.each(["😀", "👍🏽", "👨‍👩‍👧", "🇰🇷", "1️⃣", "❤️", "☺"])(
    "%s 하나면 참이다",
    (text) => {
      expect(isSingleEmoji(text)).toBe(true);
    },
  );

  it.each(["😀😀", "a", "ㅋ", "👍 ", "", "😀a"])("%j 는 거짓이다", (text) => {
    expect(isSingleEmoji(text)).toBe(false);
  });
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
