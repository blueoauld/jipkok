import {
  BIRTH_YEAR_RULES,
  NICKNAME_RULES,
  PASSWORD_CONFIRM_RULES,
} from "@/lib/validation";

describe("NICKNAME_RULES", () => {
  it("공백만 있으면 입력을 요구한다", () => {
    expect(NICKNAME_RULES.validate("   ")).toBe(
      "닉네임을 입력해주시길 바랍니다.",
    );
  });

  it("한글, 영문, 숫자, 공백만 허용한다", () => {
    expect(NICKNAME_RULES.validate("집콕 이 1")).toBe(true);
    expect(NICKNAME_RULES.validate("ㅋㅋ")).toBe(true);
    expect(NICKNAME_RULES.validate("nick!")).toBe(
      "닉네임이 올바르지 않습니다.",
    );
    expect(NICKNAME_RULES.validate("😀")).toBe("닉네임이 올바르지 않습니다.");
  });
});

describe("BIRTH_YEAR_RULES", () => {
  const year = new Date().getFullYear();

  it("네 자리 숫자만 받는다", () => {
    expect(BIRTH_YEAR_RULES.validate("")).toBe(
      "출생연도를 입력해주시길 바랍니다.",
    );
    expect(BIRTH_YEAR_RULES.validate("98")).toBe(
      "출생연도가 올바르지 않습니다.",
    );
    expect(BIRTH_YEAR_RULES.validate("19a8")).toBe(
      "출생연도가 올바르지 않습니다.",
    );
  });

  it("19세 이상 90세 이하만 통과한다", () => {
    const tooYoung = String(year - 18);
    const youngest = String(year - 19);
    const oldest = String(year - 90);
    const tooOld = String(year - 91);
    const message = "19세 이상 90세 이하만 가입할 수 있습니다.";

    expect(BIRTH_YEAR_RULES.validate(tooYoung)).toBe(message);
    expect(BIRTH_YEAR_RULES.validate(youngest)).toBe(true);
    expect(BIRTH_YEAR_RULES.validate(oldest)).toBe(true);
    expect(BIRTH_YEAR_RULES.validate(tooOld)).toBe(message);
  });
});

describe("PASSWORD_CONFIRM_RULES", () => {
  it("비밀번호와 같아야 한다", () => {
    expect(
      PASSWORD_CONFIRM_RULES.validate("abcd1234", { password: "abcd1234" }),
    ).toBe(true);
    expect(
      PASSWORD_CONFIRM_RULES.validate("abcd1234", { password: "abcd1235" }),
    ).toBe("비밀번호가 일치하지 않습니다.");
  });
});
