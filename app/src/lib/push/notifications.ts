import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { api } from "@/lib/api";

const ANDROID_CHANNEL_ID = "default";
const ANDROID_CHANNEL_NAME = "알림";

let registeredToken: string | null = null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function prepareAndroidChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: ANDROID_CHANNEL_NAME,
    importance: Notifications.AndroidImportance.DEFAULT,
  });
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
  await prepareAndroidChannel();

  if (!(await requestPermission())) {
    return;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  await api.push.register(token, Platform.OS === "ios" ? "IOS" : "ANDROID");
  registeredToken = token;
}

export async function dismissRoomNotifications(roomId: number) {
  const presented = await Notifications.getPresentedNotificationsAsync();

  await Promise.all(
    presented
      .filter(
        (notification) =>
          notification.request.content.data?.roomId === String(roomId),
      )
      .map((notification) =>
        Notifications.dismissNotificationAsync(notification.request.identifier),
      ),
  );
}

export async function unregisterPushToken() {
  if (!registeredToken) {
    return;
  }

  await api.push.remove(registeredToken);
  registeredToken = null;
}
