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
  memberLiked: "member_liked",
  chatStarted: "chat_started",
  feedPostCreated: "feed_post_created",
} as const;

export type AppEventName = (typeof APP_EVENT)[keyof typeof APP_EVENT];

export function logAppEvent(
  name: AppEventName,
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
