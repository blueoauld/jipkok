import {
  patternOf,
  type PhoneCountry,
  SUPPORTED_COUNTRIES,
  toE164,
  usePhoneCountryStore,
} from "@/lib/phone";

import spec from "../../../openapi.json";

// 나라를 더하면 여기서 컴파일이 막혀 표본을 채우게 된다.
const SAMPLES: Record<PhoneCountry, string> = {
  KR: "01012345678",
  JP: "09012345678",
  TW: "0912345678",
};

// 서버가 받는 패턴은 OpenAPI 문서에 실려 나온다. 앱에만 나라를 더하면 이 테스트가 깨진다.
const SERVER_PATTERN = new RegExp(
  spec.components.schemas.SendVerificationCodeRequest.properties.phoneNumber
    .pattern,
);

describe("나라 목록", () => {
  afterEach(() => usePhoneCountryStore.setState({ country: null }));

  it("표본이 그 나라의 입력 규칙에 맞는다", () => {
    for (const country of SUPPORTED_COUNTRIES) {
      expect(patternOf(country).test(SAMPLES[country])).toBe(true);
    }
  });

  it("모든 나라의 번호를 서버가 받는다", () => {
    for (const country of SUPPORTED_COUNTRIES) {
      usePhoneCountryStore.getState().setCountry(country);

      expect(SERVER_PATTERN.test(toE164(SAMPLES[country]))).toBe(true);
    }
  });
});
