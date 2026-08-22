import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { Controller, useForm, useWatch } from "react-hook-form";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, Text, XStack, YStack } from "tamagui";

import { ControlledInput } from "@/components/ControlledInput";
import { FormField } from "@/components/FormField";
import { FormScreen } from "@/components/FormScreen";
import { RetroButton } from "@/components/ui/RetroButton";
import { useCountdown } from "@/hooks/useCountdown";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { APP_EVENT, logAppEvent, logSignUp } from "@/lib/analytics";
import { api, apiErrorCode, type SignupRequest } from "@/lib/api";
import { SEND_CODE_BUTTON_WIDTH } from "@/lib/design";
import { codeSentMessage } from "@/lib/message";
import { openWebPage, PRIVACY_URL, TERMS_URL } from "@/lib/support";
import { useAccent } from "@/lib/theme/accent";
import { showToast } from "@/lib/toast/store";
import {
  PASSWORD_CONFIRM_RULES,
  PASSWORD_RULES,
  PHONE_NUMBER_PATTERN,
  PHONE_NUMBER_RULES,
  VERIFICATION_CODE_RULES,
} from "@/lib/validation";

const MINOR_NOTICE =
  "미성년자는 가입할 수 없습니다. 적발 시 서비스 이용이 제한됩니다.";

// 서버 VerificationCodeService.RESEND_COOLDOWN과 같다.
const RESEND_COOLDOWN_SECONDS = 30;

const SIGN_UP_METHOD = "phone";

const GENDERS = [
  { value: "MALE", label: "남자" },
  { value: "FEMALE", label: "여자" },
] as const;

export default function SignupScreen() {
  const { control, handleSubmit } = useForm<SignupRequest>({
    defaultValues: {
      phoneNumber: "",
      verificationCode: "",
      password: "",
      passwordConfirm: "",
    },
  });

  const { alertElement, show, showApiError } = useRetroAlert({
    variant: "warning",
    message: MINOR_NOTICE,
  });

  const accent = useAccent();

  const openLegal = (url: string) => openWebPage(url, show);

  const cooldown = useCountdown();

  const sendCode = useMutation({
    mutationFn: (phoneNumber: string) =>
      api.auth.sendVerificationCode(phoneNumber, "SIGNUP"),
    onSuccess: () => {
      logAppEvent(APP_EVENT.verificationCodeSent);
      cooldown.start(RESEND_COOLDOWN_SECONDS);
      showToast("info", codeSentMessage());
    },
    onError: (error) => {
      logAppEvent(APP_EVENT.verificationCodeFailed, {
        reason: apiErrorCode(error),
      });
      showApiError(error);
    },
  });

  const signup = useMutation({
    mutationFn: api.members.signup,
    onSuccess: () => {
      logSignUp(SIGN_UP_METHOD);
      router.replace("/setup");
    },
    onError: (error) => {
      logAppEvent(APP_EVENT.signUpFailed, { reason: apiErrorCode(error) });
      showApiError(error);
    },
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
          <>
            <RetroButton
              disabled={signup.isPending}
              onPress={handleSubmit((values) => signup.mutate(values))}
            >
              {signup.isPending ? <Spinner color="white" /> : "회원가입"}
            </RetroButton>

            <XStack justify="center" items="center" gap="$2" pt="$3">
              <Text
                theme="gray"
                color="$color10"
                fontSize="$2"
                onPress={() => openLegal(PRIVACY_URL)}
              >
                개인정보 처리방침
              </Text>
              <Text theme="gray" color="$color8" fontSize="$2">
                |
              </Text>
              <Text
                theme="gray"
                color="$color10"
                fontSize="$2"
                onPress={() => openLegal(TERMS_URL)}
              >
                서비스 이용약관
              </Text>
            </XStack>
          </>
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
          placeholder="비밀번호"
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          autoCapitalize="none"
        />

        <ControlledInput
          control={control}
          name="passwordConfirm"
          rules={PASSWORD_CONFIRM_RULES}
          placeholder="비밀번호 확인"
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          autoCapitalize="none"
        />

        <Controller
          control={control}
          name="gender"
          rules={{ required: "성별을 선택해주시길 바랍니다." }}
          render={({ field, fieldState }) => (
            <FormField error={fieldState.error?.message}>
              <XStack gap="$3">
                {GENDERS.map(({ value, label }) => (
                  <RetroButton
                    key={value}
                    flex={1}
                    theme={field.value === value ? accent : "gray"}
                    onPress={() => field.onChange(value)}
                  >
                    {label}
                  </RetroButton>
                ))}
              </XStack>
            </FormField>
          )}
        />
      </FormScreen>

      {alertElement}
    </SafeAreaView>
  );
}
