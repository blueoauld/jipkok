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

export function reportError(name: string, error: unknown) {
  console.error(`[${name}]`, error);

  recordError(
    getCrashlytics(),
    error instanceof Error ? error : new Error(String(error)),
    name,
  );
}
