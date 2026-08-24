import {
  getCrashlytics,
  recordError,
  setCrashlyticsCollectionEnabled,
} from "@react-native-firebase/crashlytics";

const CRASH_REPORTING_ENABLED = !__DEV__;

export function initializeCrashReporting() {
  return setCrashlyticsCollectionEnabled(
    getCrashlytics(),
    CRASH_REPORTING_ENABLED,
  ).catch(() => undefined);
}

// 크래시로 죽지 않고 처리된 오류는 여기를 거쳐야 프로덕션에서 볼 수 있다. recordError는
// Error만 받는데 STOMP 프레임처럼 Error가 아닌 것도 올라와서 감싼다. name은 묶는 이름이다.
export function reportError(name: string, error: unknown) {
  console.error(`[${name}]`, error);

  recordError(
    getCrashlytics(),
    error instanceof Error ? error : new Error(String(error)),
    name,
  );
}
