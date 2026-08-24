import { recordError } from "@react-native-firebase/crashlytics";

import { reportError } from "@/lib/crash";

const record = jest.mocked(recordError);

describe("reportError", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("Error가 아닌 값도 Error로 감싸 보고한다", () => {
    reportError("chat-socket", "로그인이 필요합니다.");

    const [, error, name] = record.mock.calls[0];

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("로그인이 필요합니다.");
    expect(name).toBe("chat-socket");
  });

  it("Error는 감싸지 않고 그대로 보고한다", () => {
    const original = new Error("업로드 실패");

    reportError("upload", original);

    expect(record.mock.calls[0][1]).toBe(original);
  });
});
