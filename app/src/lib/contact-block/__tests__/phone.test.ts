import {
  normalizeContactNumber,
  normalizeContactNumbers,
} from "@/lib/contact-block/phone";

describe("normalizeContactNumber", () => {
  it("국내 표기에 기기 국가의 코드를 붙인다", () => {
    expect(normalizeContactNumber("010-1234-5678", "KR")).toBe("+821012345678");
    expect(normalizeContactNumber("090 1234 5678", "JP")).toBe("+819012345678");
    expect(normalizeContactNumber("0912345678", "TW")).toBe("+886912345678");
  });

  it("국가 코드가 이미 있으면 그대로 쓴다", () => {
    expect(normalizeContactNumber("+82 10-1234-5678", "JP")).toBe(
      "+821012345678",
    );
    expect(normalizeContactNumber("+81 (90) 1234-5678", "KR")).toBe(
      "+819012345678",
    );
  });

  it("더하기 없이 국가 코드부터 적은 번호도 받는다", () => {
    expect(normalizeContactNumber("82 10 1234 5678", "KR")).toBe(
      "+821012345678",
    );
  });

  it("휴대폰이 아니거나 여는 나라가 아니면 버린다", () => {
    expect(normalizeContactNumber("02-123-4567", "KR")).toBeNull();
    expect(normalizeContactNumber("+1 212 555 0100", "KR")).toBeNull();
    expect(normalizeContactNumber("1588-1234", "KR")).toBeNull();
    expect(normalizeContactNumber("", "KR")).toBeNull();
  });
});

describe("normalizeContactNumbers", () => {
  it("같은 번호는 한 번만 남기고 버린 번호는 뺀다", () => {
    expect(
      normalizeContactNumbers(
        ["010-1234-5678", "+821012345678", "02-123-4567", "01099990000"],
        "KR",
      ),
    ).toEqual(["+821012345678", "+821099990000"]);
  });
});
