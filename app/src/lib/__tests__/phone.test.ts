import {
  currentCountry,
  patternOf,
  toE164,
  usePhoneCountryStore,
} from "@/lib/phone";

let mockRegionCode: string | undefined = "KR";

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "ko", regionCode: mockRegionCode }],
}));

describe("phone", () => {
  afterEach(() => {
    usePhoneCountryStore.setState({ country: null });
    mockRegionCode = "KR";
  });

  it("고른 나라가 없으면 기기 지역을 따른다", () => {
    mockRegionCode = "JP";

    expect(currentCountry()).toBe("JP");
  });

  it("열지 않은 지역은 한국으로 떨어진다", () => {
    mockRegionCode = "FR";

    expect(currentCountry()).toBe("KR");
  });

  it("지역을 모르면 한국으로 떨어진다", () => {
    mockRegionCode = undefined;

    expect(currentCountry()).toBe("KR");
  });

  it("고른 나라가 있으면 기기 지역보다 앞선다", () => {
    usePhoneCountryStore.getState().setCountry("JP");

    expect(currentCountry()).toBe("JP");
  });

  it("앞자리 0을 고른 나라의 국가 코드로 바꾼다", () => {
    expect(toE164("01012345678")).toBe("+821012345678");

    usePhoneCountryStore.getState().setCountry("JP");

    expect(toE164("09012345678")).toBe("+819012345678");
  });

  it("한국은 010으로 시작하는 11자리만 받는다", () => {
    const pattern = patternOf("KR");

    expect(pattern.test("01012345678")).toBe(true);
    expect(pattern.test("09012345678")).toBe(false);
    expect(pattern.test("0101234567")).toBe(false);
  });

  it("일본은 070, 080, 090으로 시작하는 11자리만 받는다", () => {
    const pattern = patternOf("JP");

    expect(pattern.test("07012345678")).toBe(true);
    expect(pattern.test("08012345678")).toBe(true);
    expect(pattern.test("09012345678")).toBe(true);
    expect(pattern.test("06012345678")).toBe(false);
    expect(pattern.test("01012345678")).toBe(false);
  });
});
