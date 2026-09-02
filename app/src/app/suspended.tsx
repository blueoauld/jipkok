import { router } from "expo-router";
import { ProhibitIcon } from "phosphor-react-native/src/icons/Prohibit";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, Text, useTheme, YStack } from "tamagui";

import { RetroButton } from "@/components/ui/RetroButton";
import { useLogout } from "@/hooks/useLogout";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { useWithdraw } from "@/hooks/useWithdraw";
import { formatDateTime } from "@/lib/date";
import { openSupportMail } from "@/lib/support";
import { findServiceSuspension, reasonLabel } from "@/lib/suspension";

const ICON_SIZE = 56;

export default function SuspendedScreen() {
  const { t } = useTranslation();

  const theme = useTheme();
  const { alertElement, show, showApiError, confirm } = useRetroAlert();
  const { confirmWithdraw } = useWithdraw({ show, showApiError, confirm });

  const { data: profile } = useMyProfile();
  const suspension = findServiceSuspension(profile);

  const { logout, loggingOut } = useLogout({ show, showApiError, confirm });

  useEffect(() => {
    if (profile && !suspension) {
      router.replace("/main");
    }
  }, [profile, suspension]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack flex={1} justify="center" items="center" gap="$5" p="$6">
        <ProhibitIcon size={ICON_SIZE} color={theme.red10.val} />

        <YStack gap="$2" items="center">
          <Text fontSize="$6" fontWeight="700" text="center">
            {t("suspended.title")}
          </Text>

          {suspension && (
            <>
              <Text theme="gray" color="$color10" fontSize="$4">
                {reasonLabel(suspension.reason)}
              </Text>

              <Text theme="gray" color="$color10" fontSize="$4">
                {suspension.expiresAt
                  ? t("suspended.releaseAt", {
                      at: formatDateTime(suspension.expiresAt),
                    })
                  : t("suspended.forever")}
              </Text>
            </>
          )}
        </YStack>

        <YStack width="100%" gap="$4">
          <RetroButton
            onPress={() =>
              openSupportMail(t("suspended.mailTitle"), profile?.memberId, show)
            }
          >
            {t("setting.menu.contact")}
          </RetroButton>

          <RetroButton
            theme="gray"
            disabled={loggingOut}
            onPress={() => logout()}
          >
            {loggingOut ? <Spinner color="white" /> : t("setting.menu.logout")}
          </RetroButton>

          <RetroButton theme="red" onPress={confirmWithdraw}>
            {t("setting.menu.withdraw")}
          </RetroButton>
        </YStack>
      </YStack>

      {alertElement}
    </SafeAreaView>
  );
}
