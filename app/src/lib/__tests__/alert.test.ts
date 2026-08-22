import { apiErrorMessage } from "@/lib/alert";
import { ApiError } from "@/lib/api";
import i18n from "@/lib/i18n";
import { ja } from "@/lib/i18n/ja";

describe("apiErrorMessage", () => {
  afterEach(async () => {
    await i18n.changeLanguage("ko");
  });

  it("아는 오류 코드는 현지 문구로 바꾼다", async () => {
    await i18n.changeLanguage("ja");

    const message = apiErrorMessage(
      new ApiError(409, "MEMBER_001", "이미 가입된 휴대폰 번호입니다."),
    );

    expect(message).toBe(ja.error.MEMBER_001);
  });

  it("모르는 오류 코드는 서버가 보낸 문구를 쓴다", async () => {
    await i18n.changeLanguage("ja");

    const message = apiErrorMessage(
      new ApiError(400, "MEMBER_099", "새로 생긴 오류입니다."),
    );

    expect(message).toBe("새로 생긴 오류입니다.");
  });

  it("서버 오류가 아니면 기본 문구를 쓴다", () => {
    expect(apiErrorMessage(new Error("네트워크"))).toBe(
      i18n.t("media.retryLater"),
    );
  });
});
