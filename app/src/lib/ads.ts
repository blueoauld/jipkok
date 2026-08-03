import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from "expo-tracking-transparency";
import { Platform } from "react-native";
import mobileAds, { AdsConsent, TestIds } from "react-native-google-mobile-ads";

const IOS_REWARDED_AD_UNIT_ID = "ca-app-pub-5005991782528987/1980106124";
const IOS_INTERSTITIAL_AD_UNIT_ID = "ca-app-pub-5005991782528987/5548384263";

export const REWARDED_AD_UNIT_ID =
  __DEV__ || Platform.OS !== "ios" ? TestIds.REWARDED : IOS_REWARDED_AD_UNIT_ID;

export const INTERSTITIAL_AD_UNIT_ID =
  __DEV__ || Platform.OS !== "ios"
    ? TestIds.INTERSTITIAL
    : IOS_INTERSTITIAL_AD_UNIT_ID;

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
