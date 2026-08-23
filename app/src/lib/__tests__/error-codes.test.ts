import { en } from "@/lib/i18n/en";
import { ja } from "@/lib/i18n/ja";
import { ko } from "@/lib/i18n/ko";

import spec from "../../../openapi.json";

// 서버가 오류 코드를 더하면 OpenAPI 문서의 표에 실려 나온다.
// alert.ts가 모르는 코드를 서버 문구로 조용히 떨어뜨려서, 빠뜨려도 화면에서는 티가 안 난다.
const SERVER_CODES = [
  ...spec.info.description.matchAll(/^\| ([A-Z][A-Z_0-9]*) \|/gm),
].map(([, code]) => code);

const TABLES = {
  ko: ko.error,
  ja: ja.error,
  en: en.error,
};

describe("오류 문구", () => {
  it("문서에서 코드를 읽어온다", () => {
    expect(SERVER_CODES.length).toBeGreaterThan(0);
  });

  it.each(Object.entries(TABLES))("%s에 모든 코드가 있다", (_, table) => {
    const keys = Object.keys(table);

    expect(SERVER_CODES.filter((code) => !keys.includes(code))).toEqual([]);
  });

  it.each(Object.entries(TABLES))(
    "%s에 서버가 모르는 코드가 없다",
    (_, table) => {
      const extra = Object.keys(table).filter(
        (code) => !SERVER_CODES.includes(code),
      );

      expect(extra).toEqual([]);
    },
  );
});
