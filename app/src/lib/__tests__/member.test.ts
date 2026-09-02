import {
  formatAgeRange,
  formatDistance,
  GENDER_FILTER_VALUES,
  genderLabel,
} from "@/lib/member";

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

describe("formatAgeRange", () => {
  it("전체 범위면 전체, 같으면 한 값, 아니면 구간으로 적는다", () => {
    expect(formatAgeRange(19, 90)).toBe("전체");
    expect(formatAgeRange(27, 27)).toBe("27살");
    expect(formatAgeRange(25, 35)).toBe("25살 ~ 35살");
  });
});

describe("성별", () => {
  it("필터 값 표와 라벨을 가진다", () => {
    expect(GENDER_FILTER_VALUES).toEqual({
      ALL: null,
      MALE: "MALE",
      FEMALE: "FEMALE",
    });
    expect(genderLabel("MALE")).toBe("남자");
    expect(genderLabel("FEMALE")).toBe("여자");
  });
});
