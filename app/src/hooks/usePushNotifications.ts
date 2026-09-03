import * as Notifications from "expo-notifications";
import { useSegments } from "expo-router";
import { useEffect, useRef } from "react";

import { useAuthStore } from "@/lib/auth/store";
import { reportError } from "@/lib/crash";
import { syncLocale } from "@/lib/locale-sync";
import { registerPushToken } from "@/lib/push/notifications";
import { pushOnce } from "@/lib/router";

function hrefOf(response: Notifications.NotificationResponse) {
  const { roomId, screen } = response.notification.request.content.data ?? {};

  if (roomId) {
    return `/chat/${roomId}` as const;
  }

  return screen === "feed" ? ("/feed" as const) : null;
}

export function usePushNotifications() {
  const status = useAuthStore((state) => state.status);
  const response = Notifications.useLastNotificationResponse();
  const handledId = useRef<string | null>(null);
  const [group] = useSegments();

  // 가입 직후에는 프로필 설정 화면 위로 권한 다이얼로그가 겹치므로 (app)에 들어온 뒤 등록한다.
  useEffect(() => {
    if (group !== "(app)" || status !== "authenticated") {
      return;
    }

    syncLocale().catch((error) => reportError("locale-sync", error));
    registerPushToken().catch((error) => reportError("push-token", error));
  }, [group, status]);

  useEffect(() => {
    if (group !== "(app)" || status !== "authenticated" || !response) {
      return;
    }

    const { identifier } = response.notification.request;

    if (handledId.current === identifier) {
      return;
    }

    const href = hrefOf(response);

    if (href) {
      handledId.current = identifier;
      pushOnce(href);
    }
  }, [group, response, status]);
}
