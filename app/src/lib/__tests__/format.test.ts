import {
  formatDistance,
  GENDER_FILTER_VALUES,
  genderLabel,
} from "@/lib/member";
import { formatAmount, pointTypeLabel } from "@/lib/point";
import { findServiceSuspension } from "@/lib/suspension";

describe("formatDistance", () => {
  it.each([
    [0, "0.0km"],
    [950, "0.9km"],
    [1000, "1.0km"],
    [12345, "12.3km"],
  ])("%d m → %s", (meters, expected) => {
    expect(formatDistance(meters)).toBe(expected);
  });
});

describe("formatAmount", () => {
  it("양수는 + 부호를 붙이고 세 자리마다 쉼표를 찍는다", () => {
    expect(formatAmount(1500)).toBe("+1,500");
  });

  it("음수와 0은 부호를 더하지 않는다", () => {
    expect(formatAmount(-300)).toBe("-300");
    expect(formatAmount(0)).toBe("0");
  });
});

describe("라벨", () => {
  it("성별 필터 라벨은 서버 값과 짝이 맞는다", () => {
    expect(GENDER_FILTER_VALUES).toEqual({
      전체: null,
      남자: "MALE",
      여자: "FEMALE",
    });
    expect(genderLabel("MALE")).toBe("남자");
    expect(genderLabel("FEMALE")).toBe("여자");
  });

  it("포인트 종류마다 라벨이 있다", () => {
    expect(pointTypeLabel("AD_REWARD")).toBe("광고 보상");
  });
});

describe("findServiceSuspension", () => {
  it("SERVICE 정지만 골라내고 없으면 undefined", () => {
    const service = { type: "SERVICE", reason: "ABUSE" };
    const profile = {
      suspensions: [{ type: "CHAT", reason: "ETC" }, service],
    } as never;

    expect(findServiceSuspension(profile)).toBe(service);
    expect(findServiceSuspension({ suspensions: [] } as never)).toBeUndefined();
    expect(findServiceSuspension(undefined)).toBeUndefined();
  });
});
