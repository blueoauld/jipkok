import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { api } from "@/lib/api";
import { DEVICE_PLATFORM } from "@/lib/device";
import i18n from "@/lib/i18n";
import { serverLocale } from "@/lib/locale-sync";

const ANDROID_CHANNELS = [
  { id: "default", name: i18n.t("push.channelDefault"), importance: "DEFAULT" },
  { id: "chat", name: i18n.t("push.channelChat"), importance: "HIGH" },
  { id: "feed", name: i18n.t("push.channelFeed"), importance: "HIGH" },
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

  await api.push.register(token, DEVICE_PLATFORM, serverLocale());
  registeredToken = token;
}

export function setBadgeCount(count: number) {
  Notifications.setBadgeCountAsync(count).catch(() => undefined);
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

async function unregisterPushToken() {
  if (!registeredToken) {
    return;
  }

  await api.push.remove(registeredToken);
  registeredToken = null;
}

// 로그아웃, 탈퇴처럼 이 기기와 계정의 연결을 끊을 때. 실패해도 계정 쪽 절차는 이어간다.
export async function releaseDevice() {
  await unregisterPushToken().catch(() => undefined);
  setBadgeCount(0);
}
