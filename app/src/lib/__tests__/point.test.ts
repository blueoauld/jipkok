import { formatAmount, pointTypeLabel } from "@/lib/point";

describe("formatAmount", () => {
  it("양수는 + 부호를 붙이고 세 자리마다 쉼표를 찍는다", () => {
    expect(formatAmount(1500)).toBe("+1,500");
  });

  it("음수와 0은 부호를 더하지 않는다", () => {
    expect(formatAmount(-300)).toBe("-300");
    expect(formatAmount(0)).toBe("0");
  });
});

describe("pointTypeLabel", () => {
  it("포인트 종류마다 라벨이 있다", () => {
    expect(pointTypeLabel("AD_REWARD")).toBe("광고 보상");
  });
});
