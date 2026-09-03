import { useEffect } from "react";
import { AppState, Keyboard } from "react-native";

import { shouldRelock } from "@/lib/lock";
import { useAppLockStore } from "@/lib/lock/store";

export function useAppLock() {
  const enabled = useAppLockStore((state) => state.enabled);
  const lock = useAppLockStore((state) => state.lock);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let backgroundAt: number | null = null;

    // iOS는 Face ID 프롬프트나 알림 센터만 열어도 inactive가 되므로 background만 센다.
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "background") {
        backgroundAt ??= Date.now();
        return;
      }

      if (next === "active") {
        if (shouldRelock(backgroundAt, Date.now())) {
          Keyboard.dismiss();
          lock();
        }

        backgroundAt = null;
      }
    });

    return () => subscription.remove();
  }, [enabled, lock]);
}
