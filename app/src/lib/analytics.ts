import {
  getAnalytics,
  logEvent,
  setAnalyticsCollectionEnabled,
} from "@react-native-firebase/analytics";

export const ANALYTICS_ENABLED = !__DEV__;

export function initializeAnalytics() {
  return setAnalyticsCollectionEnabled(getAnalytics(), ANALYTICS_ENABLED).catch(
    () => undefined,
  );
}

export const APP_EVENT = {
  verificationCodeSent: "verification_code_sent",
  verificationCodeFailed: "verification_code_failed",
  signUpFailed: "sign_up_failed",
  profileSetupCompleted: "profile_setup_completed",
} as const;

export function logAppEvent(
  name: (typeof APP_EVENT)[keyof typeof APP_EVENT],
  params?: Record<string, string>,
) {
  if (!ANALYTICS_ENABLED) {
    return;
  }

  Promise.resolve(logEvent(getAnalytics(), name, params)).catch(
    () => undefined,
  );
}

export function logSignUp(method: string) {
  if (!ANALYTICS_ENABLED) {
    return;
  }

  Promise.resolve(logEvent(getAnalytics(), "sign_up", { method })).catch(
    () => undefined,
  );
}
