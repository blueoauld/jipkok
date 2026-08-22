import { currentLocale } from "@/lib/i18n";
import { useLocaleStore } from "@/lib/i18n/store";

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en" }],
}));

describe("currentLocale", () => {
  afterEach(() => useLocaleStore.setState({ locale: null }));

  it("고른 언어가 없으면 기기 언어를 따르고 모르는 언어는 한국어로 떨어진다", () => {
    expect(currentLocale()).toBe("ko");
  });

  it("고른 언어가 있으면 기기 언어보다 앞선다", () => {
    useLocaleStore.getState().setLocale("ja");

    expect(currentLocale()).toBe("ja");
  });
});
