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

const CHAT_NATIVE_AD_UNIT_IDS = {
  ios: "ca-app-pub-5005991782528987/2823814273",
  android: "ca-app-pub-5005991782528987/6687037664",
};

const MEMBER_LIST_NATIVE_AD_UNIT_IDS = {
  ios: "ca-app-pub-5005991782528987/2884358177",
  android: "ca-app-pub-5005991782528987/5510521518",
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

export const CHAT_NATIVE_AD_UNIT_ID = __DEV__
  ? TestIds.NATIVE
  : Platform.select({ ...CHAT_NATIVE_AD_UNIT_IDS, default: TestIds.NATIVE });

export const MEMBER_LIST_NATIVE_AD_UNIT_ID = __DEV__
  ? TestIds.NATIVE
  : Platform.select({
      ...MEMBER_LIST_NATIVE_AD_UNIT_IDS,
      default: TestIds.NATIVE,
    });

export const LIST_AD_INTERVAL = 5;

export const MEMBER_LIST_AD_INTERVAL = 10;

export function listAdAfter<T>(
  ads: readonly T[],
  index: number,
  interval = LIST_AD_INTERVAL,
) {
  const count = index + 1;

  return count % interval === 0 ? ads[count / interval - 1] : undefined;
}

async function requestTracking() {
  const { status } = await getTrackingPermissionsAsync();

  if (status === "undetermined") {
    await requestTrackingPermissionsAsync();
  }
}

let markAdsReady: () => void = () => undefined;

const adsReady = new Promise<void>((resolve) => {
  markAdsReady = resolve;
});

export function whenAdsReady() {
  return adsReady;
}

export async function initializeAds() {
  try {
    await AdsConsent.gatherConsent().catch(() => undefined);
    await requestTracking().catch(() => undefined);
    await mobileAds().initialize();
  } finally {
    markAdsReady();
  }
}
