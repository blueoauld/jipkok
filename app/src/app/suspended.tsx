import { router } from "expo-router";
import { ProhibitIcon } from "phosphor-react-native/src/icons/Prohibit";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, useTheme, YStack } from "tamagui";

import { RetroButton } from "@/components/ui/RetroButton";
import { StatusDescription, StatusScreen } from "@/components/ui/StatusScreen";
import { useLogout } from "@/hooks/useLogout";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { useWithdraw } from "@/hooks/useWithdraw";
import { formatDateTime } from "@/lib/date";
import { STATUS_ICON_SIZE } from "@/lib/design";
import { openSupportMail } from "@/lib/support";
import { findServiceSuspension, reasonLabel } from "@/lib/suspension";

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
      <StatusScreen
        icon={<ProhibitIcon size={STATUS_ICON_SIZE} color={theme.red10.val} />}
        title={t("suspended.title")}
        description={
          suspension && (
            <>
              <StatusDescription>
                {reasonLabel(suspension.reason)}
              </StatusDescription>

              <StatusDescription>
                {suspension.expiresAt
                  ? t("suspended.releaseAt", {
                      at: formatDateTime(suspension.expiresAt),
                    })
                  : t("suspended.forever")}
              </StatusDescription>
            </>
          )
        }
      >
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
      </StatusScreen>

      {alertElement}
    </SafeAreaView>
  );
}
