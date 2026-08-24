import type { Locale } from "expo-localization";

import { deviceLocale } from "@/lib/i18n/locale";

let mockLocales: Partial<Locale>[] = [];

jest.mock("expo-localization", () => ({
  getLocales: () => mockLocales,
}));

describe("deviceLocale", () => {
  it("지원하는 기기 언어는 그대로 쓴다", () => {
    mockLocales = [{ languageCode: "ja" }];

    expect(deviceLocale()).toBe("ja");
  });

  it("모르는 기기 언어는 영어로 떨어뜨린다", () => {
    mockLocales = [{ languageCode: "fr" }];

    expect(deviceLocale()).toBe("en");
  });

  it("번체 스크립트의 중국어는 중국어로 받는다", () => {
    mockLocales = [
      { languageCode: "zh", languageTag: "zh-Hant-TW", regionCode: "TW" },
    ];

    expect(deviceLocale()).toBe("zh");
  });

  it("스크립트 없이 지역만 있어도 번체 지역이면 중국어로 받는다", () => {
    mockLocales = [
      { languageCode: "zh", languageTag: "zh-HK", regionCode: "HK" },
    ];

    expect(deviceLocale()).toBe("zh");
  });

  it("간체 중국어는 영어로 떨어뜨린다", () => {
    mockLocales = [
      { languageCode: "zh", languageTag: "zh-Hans-CN", regionCode: "CN" },
    ];

    expect(deviceLocale()).toBe("en");
  });
});
