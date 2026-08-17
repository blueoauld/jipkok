import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { ProhibitIcon } from "phosphor-react-native/src/icons/Prohibit";
import { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, Text, useTheme, YStack } from "tamagui";

import { RetroButton } from "@/components/ui/RetroButton";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { useWithdraw } from "@/hooks/useWithdraw";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/date";
import { releaseDevice } from "@/lib/push/notifications";
import { openSupportMail } from "@/lib/support";
import { findServiceSuspension, reasonLabel } from "@/lib/suspension";

const ICON_SIZE = 56;

const TITLE = "서비스 이용이 정지되었습니다.";
const FOREVER = "영구 정지";

const MAIL_TITLE = "정지문의";

export default function SuspendedScreen() {
  const theme = useTheme();
  const { alertElement, show, showApiError, confirm } = useRetroAlert();
  const { confirmWithdraw } = useWithdraw({ show, showApiError, confirm });

  const { data: profile } = useMyProfile();
  const suspension = findServiceSuspension(profile);

  const logout = useMutation({
    mutationFn: async () => {
      await releaseDevice();
      await api.auth.logout();
    },
    onError: showApiError,
  });

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
            {TITLE}
          </Text>

          {suspension && (
            <>
              <Text theme="gray" color="$color10" fontSize="$4">
                {reasonLabel(suspension.reason)}
              </Text>

              <Text theme="gray" color="$color10" fontSize="$4">
                {suspension.expiresAt
                  ? `해제일: ${formatDateTime(suspension.expiresAt)}`
                  : FOREVER}
              </Text>
            </>
          )}
        </YStack>

        <YStack width="100%" gap="$4">
          <RetroButton
            onPress={() =>
              openSupportMail(MAIL_TITLE, profile?.memberId, show)
            }
          >
            문의하기
          </RetroButton>

          <RetroButton
            theme="gray"
            disabled={logout.isPending}
            onPress={() => logout.mutate()}
          >
            {logout.isPending ? <Spinner color="white" /> : "로그아웃"}
          </RetroButton>

          <RetroButton theme="red" onPress={confirmWithdraw}>
            회원탈퇴
          </RetroButton>
        </YStack>
      </YStack>

      {alertElement}
    </SafeAreaView>
  );
}
