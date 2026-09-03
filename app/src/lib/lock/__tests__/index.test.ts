import * as LocalAuthentication from "expo-local-authentication";

import {
  authenticateDevice,
  isDeviceLockAvailable,
  RELOCK_AFTER_MILLIS,
  shouldRelock,
  shouldRetryUnlock,
} from "@/lib/lock";

jest.mock("expo-local-authentication", () => ({
  SecurityLevel: { NONE: 0, SECRET: 1, BIOMETRIC_WEAK: 2, BIOMETRIC_STRONG: 3 },
  getEnrolledLevelAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));

const getEnrolledLevel = jest.mocked(LocalAuthentication.getEnrolledLevelAsync);
const authenticate = jest.mocked(LocalAuthentication.authenticateAsync);

const NOW = 1_000_000;

describe("shouldRelock", () => {
  it("백그라운드로 간 적이 없으면 잠그지 않는다", () => {
    expect(shouldRelock(null, NOW)).toBe(false);
  });

  it("기준 시간보다 짧게 나갔다 오면 잠그지 않는다", () => {
    expect(shouldRelock(NOW - RELOCK_AFTER_MILLIS + 1, NOW)).toBe(false);
  });

  it("기준 시간 이상 나가 있었으면 잠근다", () => {
    expect(shouldRelock(NOW - RELOCK_AFTER_MILLIS, NOW)).toBe(true);
  });
});

describe("isDeviceLockAvailable", () => {
  it("기기 암호만 있어도 쓸 수 있다", async () => {
    getEnrolledLevel.mockResolvedValue(
      LocalAuthentication.SecurityLevel.SECRET,
    );

    await expect(isDeviceLockAvailable()).resolves.toBe(true);
  });

  it("기기에 잠금이 없으면 쓸 수 없다", async () => {
    getEnrolledLevel.mockResolvedValue(LocalAuthentication.SecurityLevel.NONE);

    await expect(isDeviceLockAvailable()).resolves.toBe(false);
  });
});

describe("authenticateDevice", () => {
  it("인증 결과의 성공 여부를 준다", async () => {
    authenticate.mockResolvedValue({ success: true });

    await expect(authenticateDevice()).resolves.toBe(true);
  });

  it("인증 자체가 실패하면 false를 준다", async () => {
    authenticate.mockRejectedValue(new Error("boom"));

    await expect(authenticateDevice()).resolves.toBe(false);
  });
});

describe("shouldRetryUnlock", () => {
  it("백그라운드로 간 적이 없으면 다시 띄우지 않는다", () => {
    expect(shouldRetryUnlock(null, NOW)).toBe(false);
  });

  it("프롬프트가 만든 백그라운드면 다시 띄우지 않는다", () => {
    expect(shouldRetryUnlock(NOW - 1, NOW)).toBe(false);
  });

  it("프롬프트가 끝난 뒤 나갔다 돌아왔으면 다시 띄운다", () => {
    expect(shouldRetryUnlock(NOW + 1, NOW)).toBe(true);
  });
});
