import * as LocalAuthentication from "expo-local-authentication";

import i18n from "@/lib/i18n";

// 안드로이드는 앨범이나 카메라를 열어도 백그라운드로 가므로 잠깐 나갔다 온 건 잠그지 않는다.
export const RELOCK_AFTER_MILLIS = 30_000;

export function shouldRelock(backgroundAt: number | null, now: number) {
  return backgroundAt !== null && now - backgroundAt >= RELOCK_AFTER_MILLIS;
}

// 생체 인증이 없어도 기기 암호가 있으면 OS가 그것으로 대신 받는다.
export async function isDeviceLockAvailable() {
  const level = await LocalAuthentication.getEnrolledLevelAsync();

  return level !== LocalAuthentication.SecurityLevel.NONE;
}

export async function authenticateDevice() {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: i18n.t("lock.prompt"),
      cancelLabel: i18n.t("lock.cancel"),
    });

    return result.success;
  } catch {
    return false;
  }
}
