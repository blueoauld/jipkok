import { LockKeyIcon } from "phosphor-react-native/src/icons/LockKey";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppState, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, useTheme, YStack } from "tamagui";

import { RetroButton } from "@/components/ui/RetroButton";
import { StatusDescription, StatusScreen } from "@/components/ui/StatusScreen";
import { useAppLock } from "@/hooks/useAppLock";
import { STATUS_ICON_SIZE } from "@/lib/design";
import {
  authenticateDevice,
  isDeviceLockAvailable,
  shouldRetryUnlock,
} from "@/lib/lock";
import { useAppLocked, useAppLockStore } from "@/lib/lock/store";
import { useThemeBackgroundColor } from "@/lib/theme/accent";
import { showToast } from "@/lib/toast/store";

function LockScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const background = useThemeBackgroundColor();
  const unlock = useAppLockStore((state) => state.unlock);
  const setEnabled = useAppLockStore((state) => state.setEnabled);
  const [authenticating, setAuthenticating] = useState(false);
  const busy = useRef(false);
  const promptEndedAt = useRef(0);

  const attempt = useCallback(async () => {
    if (busy.current) {
      return;
    }

    busy.current = true;
    setAuthenticating(true);

    try {
      // 켠 뒤에 기기 잠금을 지우면 인증이 영영 실패하므로 여기서 풀어 준다.
      if (!(await isDeviceLockAvailable())) {
        setEnabled(false);
        showToast("warning", t("lock.turnedOff"));
        return;
      }

      if (await authenticateDevice()) {
        unlock();
      }
    } finally {
      promptEndedAt.current = Date.now();
      busy.current = false;
      setAuthenticating(false);
    }
  }, [setEnabled, t, unlock]);

  useEffect(() => {
    attempt();
  }, [attempt]);

  useEffect(() => {
    let backgroundAt: number | null = null;

    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "background") {
        backgroundAt ??= Date.now();
        return;
      }

      if (next === "active") {
        if (shouldRetryUnlock(backgroundAt, promptEndedAt.current)) {
          attempt();
        }

        backgroundAt = null;
      }
    });

    return () => subscription.remove();
  }, [attempt]);

  return (
    <YStack style={[StyleSheet.absoluteFill, { backgroundColor: background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusScreen
          icon={
            <LockKeyIcon size={STATUS_ICON_SIZE} color={theme.color12.val} />
          }
          title={t("lock.title")}
          description={
            <StatusDescription>{t("lock.description")}</StatusDescription>
          }
        >
          <YStack width="100%">
            <RetroButton disabled={authenticating} onPress={attempt}>
              {authenticating ? <Spinner color="$color11" /> : t("lock.unlock")}
            </RetroButton>
          </YStack>
        </StatusScreen>
      </SafeAreaView>
    </YStack>
  );
}

// Modal과 시트는 잠긴 동안 useVisibleWhenUnlocked로 스스로 숨는다.
export function AppLockOverlay() {
  useAppLock();

  return useAppLocked() ? <LockScreen /> : null;
}
