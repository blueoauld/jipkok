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

async function currentPushToken() {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });

  return data;
}

export async function registerPushToken() {
  await prepareAndroidChannels();

  if (!(await requestPermission())) {
    return;
  }

  const token = await currentPushToken();

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

// 등록이 실패했으면 registeredToken이 비어 있는데, 서버에는 지난 세션에 넣은 토큰이 남아
// 있을 수 있다. 그대로 두면 이 기기가 계정에 붙은 채 알림을 계속 받으므로 다시 구해 본다.
async function unregisterPushToken() {
  const token = registeredToken ?? (await currentPushToken());

  await api.push.remove(token);
  registeredToken = null;
}

// 로그아웃처럼 이 기기와 계정의 연결을 끊을 때. 실패해도 계정 쪽 절차는 이어간다.
export async function releaseDevice() {
  await unregisterPushToken().catch(() => undefined);
  setBadgeCount(0);
}

// 탈퇴는 서버가 트랜잭션 안에서 기기 토큰까지 지우므로 삭제를 따로 보내지 않는다. 미리
// 보내면 탈퇴가 실패했을 때 로그인 상태로 남은 기기만 알림을 잃는다.
export function forgetDevice() {
  registeredToken = null;
  setBadgeCount(0);
}
