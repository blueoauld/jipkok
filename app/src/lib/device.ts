import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

import type { DevicePlatform } from "@/lib/api/types";

export const DEVICE_PLATFORM: DevicePlatform =
  Platform.OS === "ios" ? "IOS" : "ANDROID";

export const DEVICE_NAME = Device.modelName ?? undefined;

export const APP_VERSION = Constants.expoConfig?.version ?? "unknown";
