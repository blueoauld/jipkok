import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from "expo-tracking-transparency";
import mobileAds, { AdsConsent, TestIds } from "react-native-google-mobile-ads";

export const REWARDED_AD_UNIT_ID = TestIds.REWARDED;

export const INTERSTITIAL_AD_UNIT_ID = TestIds.INTERSTITIAL;

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
