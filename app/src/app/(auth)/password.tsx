import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useForm, useWatch } from "react-hook-form";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, XStack, YStack } from "tamagui";

import { ControlledInput } from "@/components/ControlledInput";
import { FormScreen } from "@/components/FormScreen";
import { RetroButton } from "@/components/ui/RetroButton";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { api, type ResetPasswordRequest } from "@/lib/api";
import { showToast } from "@/lib/toast/store";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PHONE_NUMBER_PATTERN,
  PHONE_NUMBER_RULES,
} from "@/lib/validation";

const CODE_SENT_MESSAGE = "인증번호를 보냈습니다.";
const RESET_MESSAGE = "비밀번호를 바꿨습니다. 다시 로그인해주시길 바랍니다.";

const VERIFICATION_CODE_PATTERN = /^\d{6}$/;

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

  const sendCode = useMutation({
    mutationFn: (phoneNumber: string) =>
      api.auth.sendVerificationCode(phoneNumber, PURPOSE),
    onSuccess: () => showToast("info", CODE_SENT_MESSAGE),
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
    PHONE_NUMBER_PATTERN.test(phoneNumber) && !sendCode.isPending;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <FormScreen
        scrollMode="layout"
        footer={
          <RetroButton
            disabled={reset.isPending}
            onPress={handleSubmit((values) => reset.mutate(values))}
          >
            {reset.isPending ? <Spinner color="white" /> : "비밀번호 바꾸기"}
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
            />
          </YStack>

          <RetroButton
            disabled={!canSendCode}
            onPress={() => sendCode.mutate(phoneNumber)}
          >
            {sendCode.isPending ? <Spinner color="white" /> : "전송"}
          </RetroButton>
        </XStack>

        <ControlledInput
          control={control}
          name="verificationCode"
          rules={{
            required: "인증번호를 입력해주시길 바랍니다.",
            pattern: {
              value: VERIFICATION_CODE_PATTERN,
              message: "인증번호가 올바르지 않습니다.",
            },
          }}
          placeholder="인증번호"
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={6}
        />

        <ControlledInput
          control={control}
          name="password"
          rules={{
            required: "비밀번호를 입력해주시길 바랍니다.",
            minLength: {
              value: PASSWORD_MIN_LENGTH,
              message: `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상 ${PASSWORD_MAX_LENGTH}자 이하여야 합니다.`,
            },
            maxLength: {
              value: PASSWORD_MAX_LENGTH,
              message: `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상 ${PASSWORD_MAX_LENGTH}자 이하여야 합니다.`,
            },
            deps: "passwordConfirm",
          }}
          placeholder="새 비밀번호"
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          autoCapitalize="none"
        />

        <ControlledInput
          control={control}
          name="passwordConfirm"
          rules={{
            required: "비밀번호를 한 번 더 입력해주시길 바랍니다.",
            validate: (value, values) =>
              value === values.password || "비밀번호가 일치하지 않습니다.",
          }}
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
