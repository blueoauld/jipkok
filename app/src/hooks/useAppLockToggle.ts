import { useCallback, useState } from "react";

import type { AlertApi } from "@/hooks/useAlert";
import i18n from "@/lib/i18n";
import { authenticateDevice, isDeviceLockAvailable } from "@/lib/lock";
import { useAppLockStore } from "@/lib/lock/store";
import { showToast } from "@/lib/toast/store";

const UNAVAILABLE_MESSAGE = i18n.t("lock.unavailable");
const TURNED_OFF_MESSAGE = i18n.t("lock.turnedOff");
const ENABLED_MESSAGE = i18n.t("lock.enabled");
const DISABLED_MESSAGE = i18n.t("lock.disabled");

// 끌 때도 인증을 받아야 남이 잠금을 풀어 두지 못한다.
export function useAppLockToggle({ show }: AlertApi) {
  const enabled = useAppLockStore((state) => state.enabled);
  const setEnabled = useAppLockStore((state) => state.setEnabled);
  const [pending, setPending] = useState(false);

  const toggle = useCallback(async () => {
    if (pending) {
      return;
    }

    setPending(true);

    try {
      // 켠 뒤에 기기 잠금을 지우면 인증이 영영 실패해 끄지도 못한다. 켤 때만 보지
      // 않고 항상 보고, 이미 켜져 있었으면 AppLockOverlay와 같게 그냥 풀어 준다.
      if (!(await isDeviceLockAvailable())) {
        if (enabled) {
          setEnabled(false);
          showToast("warning", TURNED_OFF_MESSAGE);
        } else {
          show(UNAVAILABLE_MESSAGE);
        }

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
