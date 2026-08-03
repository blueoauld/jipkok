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

export const REWARDED_AD_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : Platform.select({ ...REWARDED_AD_UNIT_IDS, default: TestIds.REWARDED });

export const INTERSTITIAL_AD_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : Platform.select({
      ...INTERSTITIAL_AD_UNIT_IDS,
      default: TestIds.INTERSTITIAL,
    });

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
