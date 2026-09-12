import { splitLinks } from "@/lib/chat/links";

describe("splitLinks", () => {
  it("링크가 없으면 글 전체를 한 조각으로 준다", () => {
    expect(splitLinks("안녕하세요")).toEqual([{ text: "안녕하세요" }]);
  });

  it("글 사이의 링크를 따로 떼어 준다", () => {
    expect(splitLinks("여기 https://jipkok.app 봐요")).toEqual([
      { text: "여기 " },
      { text: "https://jipkok.app", url: "https://jipkok.app" },
      { text: " 봐요" },
    ]);
  });

  it("www.로 시작하면 https를 붙여 연다", () => {
    expect(splitLinks("www.jipkok.app")).toEqual([
      { text: "www.jipkok.app", url: "https://www.jipkok.app" },
    ]);
  });

  it("문장 끝의 마침표와 괄호는 링크에서 뺀다", () => {
    expect(splitLinks("(https://jipkok.app/terms).")).toEqual([
      { text: "(" },
      { text: "https://jipkok.app/terms", url: "https://jipkok.app/terms" },
      { text: ")." },
    ]);
  });

  it("경로의 괄호는 짝이 맞는 만큼 닫는 괄호를 남긴다", () => {
    expect(splitLinks("https://ko.wikipedia.org/wiki/Foo_(bar)")).toEqual([
      {
        text: "https://ko.wikipedia.org/wiki/Foo_(bar)",
        url: "https://ko.wikipedia.org/wiki/Foo_(bar)",
      },
    ]);
    expect(splitLinks("(https://a.com/x_(y)).")).toEqual([
      { text: "(" },
      { text: "https://a.com/x_(y)", url: "https://a.com/x_(y)" },
      { text: ")." },
    ]);
  });

  it("링크 뒤에 붙은 CJK 문장부호는 링크에서 뺀다", () => {
    expect(splitLinks("看這裡https://jipkok.app，謝謝")).toEqual([
      { text: "看這裡" },
      { text: "https://jipkok.app", url: "https://jipkok.app" },
      { text: "，謝謝" },
    ]);
    expect(splitLinks("ここです https://jipkok.app。")).toEqual([
      { text: "ここです " },
      { text: "https://jipkok.app", url: "https://jipkok.app" },
      { text: "。" },
    ]);
  });

  it("대문자로 시작해도 링크로 본다", () => {
    expect(splitLinks("Www.jipkok.app")).toEqual([
      { text: "Www.jipkok.app", url: "https://Www.jipkok.app" },
    ]);
  });

  it("링크가 여러 개면 순서대로 준다", () => {
    expect(
      splitLinks("https://a.com https://b.com").map((segment) => segment.url),
    ).toEqual(["https://a.com", undefined, "https://b.com"]);
  });

  it("빈 글은 빈 배열이다", () => {
    expect(splitLinks("")).toEqual([]);
  });
});
