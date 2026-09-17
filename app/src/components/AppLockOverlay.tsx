import { LockKeyIcon } from "phosphor-react-native/src/icons/LockKey";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppState, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, YStack } from "tamagui";

import { Button } from "@/components/ui/Button";
import { StatusDescription, StatusScreen } from "@/components/ui/StatusScreen";
import { useAppLock } from "@/hooks/useAppLock";
import { useBlockGoBack } from "@/hooks/useBlockGoBack";
import { STATUS_ICON_SIZE } from "@/lib/design";
import {
  authenticateDevice,
  isDeviceLockAvailable,
  shouldRetryUnlock,
} from "@/lib/lock";
import { useAppLocked, useAppLockStore } from "@/lib/lock/store";
import { showToast } from "@/lib/toast/store";

function LockScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const unlock = useAppLockStore((state) => state.unlock);
  const setEnabled = useAppLockStore((state) => state.setEnabled);
  const [authenticating, setAuthenticating] = useState(false);
  const busy = useRef(false);
  const promptEndedAt = useRef(0);

  // 잠금 화면은 트리 안의 겹침이라 뒤로가기가 아래 네비게이터로 새어 나간다. 가려진
  // 화면이 몰래 넘어가면 풀고 나서 다른 곳에 서 있거나 저장 안 한 내용을 잃는다.
  useBlockGoBack();

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
    <YStack
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: theme.background.val },
      ]}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <StatusScreen
          icon={
            <LockKeyIcon size={STATUS_ICON_SIZE} color={theme.grey900.val} />
          }
          title={t("lock.title")}
          description={
            <StatusDescription>{t("lock.description")}</StatusDescription>
          }
        >
          <YStack width="100%">
            <Button loading={authenticating} onPress={attempt}>
              {t("lock.unlock")}
            </Button>
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
