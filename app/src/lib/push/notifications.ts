import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { api } from "@/lib/api";
import { DEVICE_PLATFORM } from "@/lib/device";

const ANDROID_CHANNELS = [
  { id: "default", name: "알림", importance: "DEFAULT" },
  { id: "feed", name: "피드", importance: "HIGH" },
] as const;

let registeredToken: string | null = null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function prepareAndroidChannels() {
  if (Platform.OS !== "android") {
    return;
  }

  await Promise.all(
    ANDROID_CHANNELS.map(({ id, name, importance }) =>
      Notifications.setNotificationChannelAsync(id, {
        name,
        importance: Notifications.AndroidImportance[importance],
      }),
    ),
  );
}

async function requestPermission() {
  const { status } = await Notifications.getPermissionsAsync();

  if (status === "granted") {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();

  return requested.status === "granted";
}

export async function registerPushToken() {
  await prepareAndroidChannels();

  if (!(await requestPermission())) {
    return;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  await api.push.register(token, DEVICE_PLATFORM);
  registeredToken = token;
}

export function setBadgeCount(count: number) {
  Notifications.setBadgeCountAsync(count).catch(() => undefined);
}

export async function unregisterPushToken() {
  if (!registeredToken) {
    return;
  }

  await api.push.remove(registeredToken);
  registeredToken = null;
}
