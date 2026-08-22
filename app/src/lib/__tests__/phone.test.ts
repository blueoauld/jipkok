import { toE164 } from "@/lib/phone";

describe("toE164", () => {
  it("앞자리 0을 국가 코드로 바꾼다", () => {
    expect(toE164("01012345678")).toBe("+821012345678");
  });
});
