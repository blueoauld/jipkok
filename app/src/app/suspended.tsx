import { router } from "expo-router";
import { ProhibitIcon } from "phosphor-react-native/src/icons/Prohibit";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, YStack } from "tamagui";

import { Button } from "@/components/ui/Button";
import { StatusDescription, StatusScreen } from "@/components/ui/StatusScreen";
import { useAlert } from "@/hooks/useAlert";
import { useLogout } from "@/hooks/useLogout";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useWithdraw } from "@/hooks/useWithdraw";
import { formatDateTime } from "@/lib/date";
import { STATUS_ICON_SIZE } from "@/lib/design";
import { openSupportMail } from "@/lib/support";
import { findServiceSuspension, reasonLabel } from "@/lib/suspension";

export default function SuspendedScreen() {
  const { t } = useTranslation();

  const theme = useTheme();
  const { alertElement, show, showApiError, confirm } = useAlert();
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
        icon={<ProhibitIcon size={STATUS_ICON_SIZE} color={theme.red500.val} />}
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
          <Button
            onPress={() =>
              openSupportMail(t("suspended.mailTitle"), profile?.memberId, show)
            }
          >
            {t("setting.menu.contact")}
          </Button>

          <Button
            variant="secondary"
            loading={loggingOut}
            onPress={() => logout()}
          >
            {t("setting.menu.logout")}
          </Button>

          <Button variant="danger" onPress={confirmWithdraw}>
            {t("setting.menu.withdraw")}
          </Button>
        </YStack>
      </StatusScreen>

      {alertElement}
    </SafeAreaView>
  );
}
