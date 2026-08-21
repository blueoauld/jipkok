import type { WorryCategory } from "@/lib/api";
import { WORRY_CATEGORIES, worryCategoryLabel } from "@/lib/worry";

describe("worryCategoryLabel", () => {
  it("분류마다 이름을 준다", () => {
    expect(worryCategoryLabel("LOVE")).toBe("연애");
    expect(worryCategoryLabel("ETC")).toBe("기타");
  });

  it("모르는 분류는 기타로 그린다", () => {
    expect(worryCategoryLabel("NEIGHBOR" as WorryCategory)).toBe("기타");
  });
});

describe("WORRY_CATEGORIES", () => {
  it("기타를 맨 뒤에 둔 일곱 갈래다", () => {
    expect(WORRY_CATEGORIES).toEqual([
      "LOVE",
      "RELATIONSHIP",
      "WORK",
      "FAMILY",
      "MIND",
      "LIFE",
      "ETC",
    ]);
  });
});
