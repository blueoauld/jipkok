import {
  getCrashlytics,
  setCrashlyticsCollectionEnabled,
} from "@react-native-firebase/crashlytics";

const CRASH_REPORTING_ENABLED = !__DEV__;

export function initializeCrashReporting() {
  return setCrashlyticsCollectionEnabled(
    getCrashlytics(),
    CRASH_REPORTING_ENABLED,
  ).catch(() => undefined);
}
