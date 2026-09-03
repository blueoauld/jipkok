import { LockKeyIcon } from "phosphor-react-native/src/icons/LockKey";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, Text, useTheme, YStack } from "tamagui";

import { RetroButton } from "@/components/ui/RetroButton";
import { useAppLock } from "@/hooks/useAppLock";
import { authenticateDevice } from "@/lib/lock";
import { useAppLockStore } from "@/lib/lock/store";
import { useThemeBackgroundColor } from "@/lib/theme/accent";

const ICON_SIZE = 56;

function LockScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const background = useThemeBackgroundColor();
  const unlock = useAppLockStore((state) => state.unlock);
  const [authenticating, setAuthenticating] = useState(false);
  const busy = useRef(false);

  const attempt = useCallback(async () => {
    if (busy.current) {
      return;
    }

    busy.current = true;
    setAuthenticating(true);

    try {
      if (await authenticateDevice()) {
        unlock();
      }
    } finally {
      busy.current = false;
      setAuthenticating(false);
    }
  }, [unlock]);

  useEffect(() => {
    attempt();
  }, [attempt]);

  return (
    <YStack style={[StyleSheet.absoluteFill, { backgroundColor: background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <YStack flex={1} justify="center" items="center" gap="$5" p="$6">
          <LockKeyIcon size={ICON_SIZE} color={theme.color12.val} />

          <YStack gap="$2" items="center">
            <Text fontSize="$6" fontWeight="700" text="center">
              {t("lock.title")}
            </Text>

            <Text theme="gray" color="$color10" fontSize="$4" text="center">
              {t("lock.description")}
            </Text>
          </YStack>

          <YStack width="100%">
            <RetroButton disabled={authenticating} onPress={attempt}>
              {authenticating ? <Spinner color="white" /> : t("lock.unlock")}
            </RetroButton>
          </YStack>
        </YStack>
      </SafeAreaView>
    </YStack>
  );
}

export function AppLockOverlay() {
  useAppLock();

  const enabled = useAppLockStore((state) => state.enabled);
  const locked = useAppLockStore((state) => state.locked);

  return enabled && locked ? <LockScreen /> : null;
}
