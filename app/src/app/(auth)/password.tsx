import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useForm, useWatch } from "react-hook-form";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, XStack, YStack } from "tamagui";

import { ControlledInput } from "@/components/ControlledInput";
import { FormScreen } from "@/components/FormScreen";
import { RetroButton } from "@/components/ui/RetroButton";
import { useCountdown } from "@/hooks/useCountdown";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { api, type ResetPasswordRequest } from "@/lib/api";
import { SEND_CODE_BUTTON_WIDTH } from "@/lib/design";
import { codeSentMessage } from "@/lib/message";
import { showToast } from "@/lib/toast/store";
import {
  PASSWORD_CONFIRM_RULES,
  PASSWORD_RULES,
  PHONE_NUMBER_PATTERN,
  PHONE_NUMBER_RULES,
  VERIFICATION_CODE_RULES,
} from "@/lib/validation";

// 서버 VerificationCodeService.RESEND_COOLDOWN과 같다.
const RESEND_COOLDOWN_SECONDS = 30;
const RESET_MESSAGE = "비밀번호를 바꿨습니다. 다시 로그인해주시길 바랍니다.";

const PURPOSE = "PASSWORD_RESET";

export default function PasswordScreen() {
  const { control, handleSubmit } = useForm<ResetPasswordRequest>({
    defaultValues: {
      phoneNumber: "",
      verificationCode: "",
      password: "",
      passwordConfirm: "",
    },
  });

  const { alertElement, showApiError } = useRetroAlert();

  const cooldown = useCountdown();

  const sendCode = useMutation({
    mutationFn: (phoneNumber: string) =>
      api.auth.sendVerificationCode(phoneNumber, PURPOSE),
    onSuccess: () => {
      cooldown.start(RESEND_COOLDOWN_SECONDS);
      showToast("info", codeSentMessage());
    },
    onError: showApiError,
  });

  const reset = useMutation({
    mutationFn: api.auth.resetPassword,
    onSuccess: () => {
      router.back();
      showToast("info", RESET_MESSAGE);
    },
    onError: showApiError,
  });

  const phoneNumber = useWatch({ control, name: "phoneNumber" });

  const canSendCode =
    PHONE_NUMBER_PATTERN.test(phoneNumber) &&
    !sendCode.isPending &&
    cooldown.remaining === 0;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <FormScreen
        scrollMode="layout"
        footer={
          <RetroButton
            disabled={reset.isPending}
            onPress={handleSubmit((values) => reset.mutate(values))}
          >
            {reset.isPending ? <Spinner color="white" /> : "비밀번호 변경"}
          </RetroButton>
        }
      >
        <XStack gap="$2" items="flex-start">
          <YStack flex={1}>
            <ControlledInput
              control={control}
              name="phoneNumber"
              rules={PHONE_NUMBER_RULES}
              placeholder="휴대폰 번호"
              keyboardType="number-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              maxLength={11}
              clearable
            />
          </YStack>

          <RetroButton
            width={SEND_CODE_BUTTON_WIDTH}
            disabled={!canSendCode}
            onPress={() => sendCode.mutate(phoneNumber)}
          >
            {sendCode.isPending ? (
              <Spinner color="white" />
            ) : cooldown.remaining > 0 ? (
              `${cooldown.remaining}초`
            ) : (
              "전송"
            )}
          </RetroButton>
        </XStack>

        <ControlledInput
          control={control}
          name="verificationCode"
          rules={VERIFICATION_CODE_RULES}
          placeholder="인증번호"
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={6}
          clearable
        />

        <ControlledInput
          control={control}
          name="password"
          rules={PASSWORD_RULES}
          placeholder="새 비밀번호"
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          autoCapitalize="none"
        />

        <ControlledInput
          control={control}
          name="passwordConfirm"
          rules={PASSWORD_CONFIRM_RULES}
          placeholder="새 비밀번호 확인"
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          autoCapitalize="none"
        />
      </FormScreen>

      {alertElement}
    </SafeAreaView>
  );
}
