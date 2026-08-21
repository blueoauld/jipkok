import type { MyProfileResponse, SuspensionResponse } from "@/lib/api";
import { findServiceSuspension, reasonLabel } from "@/lib/suspension";

function suspension(type: SuspensionResponse["type"]): SuspensionResponse {
  return {
    type,
    reason: "ABUSE",
    startedAt: "2026-08-01T00:00:00Z",
  } as SuspensionResponse;
}

function profile(suspensions: SuspensionResponse[]) {
  return { suspensions } as MyProfileResponse;
}

describe("findServiceSuspension", () => {
  it("서비스 정지만 고른다", () => {
    const service = suspension("SERVICE");

    expect(
      findServiceSuspension(profile([suspension("SECRET_PHOTO"), service])),
    ).toBe(service);
  });

  it("다른 유형만 있으면 찾지 않는다", () => {
    expect(
      findServiceSuspension(profile([suspension("PROFILE_EDIT")])),
    ).toBeUndefined();
  });

  it("프로필을 아직 못 받았으면 찾지 않는다", () => {
    expect(findServiceSuspension(undefined)).toBeUndefined();
  });
});

describe("reasonLabel", () => {
  it("사유를 한글로 바꾼다", () => {
    expect(reasonLabel("MONEY_TRANSACTION")).toBe("금전거래");
    expect(reasonLabel("SCREEN_CAPTURE")).toBe("화면 캡처");
  });
});
