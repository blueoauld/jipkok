import {
  getAnalytics,
  setAnalyticsCollectionEnabled,
} from "@react-native-firebase/analytics";

export const ANALYTICS_ENABLED = !__DEV__;

export function initializeAnalytics() {
  return setAnalyticsCollectionEnabled(getAnalytics(), ANALYTICS_ENABLED).catch(
    () => undefined,
  );
}
