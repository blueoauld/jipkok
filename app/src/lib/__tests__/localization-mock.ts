// 테스트는 기기 언어를 타지 않게 한국어로 고정한다.
jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "ko" }],
}));
