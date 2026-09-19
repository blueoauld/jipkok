import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from "expo-tracking-transparency";
import { Platform } from "react-native";
import mobileAds, { AdsConsent, TestIds } from "react-native-google-mobile-ads";

const REWARDED_AD_UNIT_IDS = {
  ios: "ca-app-pub-5005991782528987/1980106124",
  android: "ca-app-pub-5005991782528987/7822457728",
};

const INTERSTITIAL_AD_UNIT_IDS = {
  ios: "ca-app-pub-5005991782528987/5548384263",
  android: "ca-app-pub-5005991782528987/4235280513",
};

const NATIVE_AD_UNIT_IDS = {
  ios: "ca-app-pub-5005991782528987/2370362019",
  android: "ca-app-pub-5005991782528987/6698198847",
};

export const REWARDED_AD_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : Platform.select({ ...REWARDED_AD_UNIT_IDS, default: TestIds.REWARDED });

export const INTERSTITIAL_AD_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : Platform.select({
      ...INTERSTITIAL_AD_UNIT_IDS,
      default: TestIds.INTERSTITIAL,
    });

export const NATIVE_AD_UNIT_ID = __DEV__
  ? TestIds.NATIVE
  : Platform.select({ ...NATIVE_AD_UNIT_IDS, default: TestIds.NATIVE });

export const CHAT_NATIVE_AD_UNIT_ID = TestIds.NATIVE;

export const LIST_AD_INTERVAL = 5;

export function listAdAfter<T>(ads: readonly T[], index: number) {
  const count = index + 1;

  return count % LIST_AD_INTERVAL === 0
    ? ads[count / LIST_AD_INTERVAL - 1]
    : undefined;
}

async function requestTracking() {
  const { status } = await getTrackingPermissionsAsync();

  if (status === "undetermined") {
    await requestTrackingPermissionsAsync();
  }
}

export async function initializeAds() {
  await AdsConsent.gatherConsent().catch(() => undefined);
  await requestTracking().catch(() => undefined);
  await mobileAds().initialize();
}
