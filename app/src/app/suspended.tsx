import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { ProhibitIcon } from "phosphor-react-native";
import { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, useTheme, YStack } from "tamagui";

import { useMyProfile } from "@/hooks/useMyProfile";
import { useWithdraw } from "@/hooks/useWithdraw";
import { alertApiError, alertMessage } from "@/lib/alert";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/date";
import { MAIL_FAILED_MESSAGE, openSupportMail } from "@/lib/support";
import { findServiceSuspension, reasonLabel } from "@/lib/suspension";

const ICON_SIZE = 56;

const TITLE = "서비스 이용이 정지되었습니다.";
const FOREVER = "영구 정지";

const MAIL_TITLE = "정지문의";

export default function SuspendedScreen() {
  const theme = useTheme();
  const confirmWithdraw = useWithdraw();

  const { data: profile } = useMyProfile();
  const suspension = findServiceSuspension(profile);

  const logout = useMutation({
    mutationFn: api.auth.logout,
    onError: alertApiError,
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

        <YStack width="100%" gap="$3">
          <Button
            size="$4"
            theme="blue"
            rounded="$7"
            onPress={() =>
              openSupportMail(MAIL_TITLE, profile?.memberId).catch(() =>
                alertMessage(MAIL_FAILED_MESSAGE),
              )
            }
          >
            문의하기
          </Button>

          <Button size="$4" rounded="$7" onPress={() => logout.mutate()}>
            로그아웃
          </Button>

          <Button size="$4" theme="red" rounded="$7" onPress={confirmWithdraw}>
            회원탈퇴
          </Button>
        </YStack>
      </YStack>
    </SafeAreaView>
  );
}
