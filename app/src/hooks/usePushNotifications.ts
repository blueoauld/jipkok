import * as Notifications from "expo-notifications";
import { useEffect } from "react";

import { useAuthStore } from "@/lib/auth/store";
import { registerPushToken } from "@/lib/push/notifications";
import { pushOnce } from "@/lib/router";

function openRoom(response: Notifications.NotificationResponse) {
  const roomId = response.notification.request.content.data?.roomId;

  if (roomId) {
    pushOnce(`/chat/${roomId}`);
  }
}

export function usePushNotifications() {
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    registerPushToken().catch(() => undefined);
  }, [status]);

  useEffect(() => {
    const subscription =
      Notifications.addNotificationResponseReceivedListener(openRoom);

    return () => subscription.remove();
  }, []);
}
