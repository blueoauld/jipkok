import { useCallback, useState } from "react";

import type { RetroAlertApi } from "@/hooks/useRetroAlert";
import i18n from "@/lib/i18n";
import { authenticateDevice, isDeviceLockAvailable } from "@/lib/lock";
import { useAppLockStore } from "@/lib/lock/store";
import { showToast } from "@/lib/toast/store";

const UNAVAILABLE_MESSAGE = i18n.t("lock.unavailable");
const ENABLED_MESSAGE = i18n.t("lock.enabled");
const DISABLED_MESSAGE = i18n.t("lock.disabled");

// 끌 때도 인증을 받아야 남이 잠금을 풀어 두지 못한다.
export function useAppLockToggle({ show }: Pick<RetroAlertApi, "show">) {
  const enabled = useAppLockStore((state) => state.enabled);
  const setEnabled = useAppLockStore((state) => state.setEnabled);
  const [pending, setPending] = useState(false);

  const toggle = useCallback(async () => {
    if (pending) {
      return;
    }

    setPending(true);

    try {
      if (!enabled && !(await isDeviceLockAvailable())) {
        show("warning", UNAVAILABLE_MESSAGE);
        return;
      }

      if (!(await authenticateDevice())) {
        return;
      }

      setEnabled(!enabled);
      showToast("info", enabled ? DISABLED_MESSAGE : ENABLED_MESSAGE);
    } finally {
      setPending(false);
    }
  }, [enabled, pending, setEnabled, show]);

  return { enabled, pending, toggle };
}
