import * as Notifications from "expo-notifications";
import { useSegments } from "expo-router";
import { useEffect, useRef } from "react";

import { useAuthStore } from "@/lib/auth/store";
import { registerPushToken } from "@/lib/push/notifications";
import { pushOnce } from "@/lib/router";

function hrefOf(response: Notifications.NotificationResponse) {
  const { screen } = response.notification.request.content.data ?? {};

  return screen === "feed" ? ("/feed" as const) : null;
}

export function usePushNotifications() {
  const status = useAuthStore((state) => state.status);
  const response = Notifications.useLastNotificationResponse();
  const handledId = useRef<string | null>(null);
  const [group] = useSegments();

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    registerPushToken().catch(() => undefined);
  }, [status]);

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
