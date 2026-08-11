import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Spinner, Text, XStack, YStack } from "tamagui";

import { ControlledInput } from "@/components/ControlledInput";
import { FormField } from "@/components/FormField";
import { RetroAlert, type RetroAlertVariant } from "@/components/ui/RetroAlert";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroInput } from "@/components/ui/RetroInput";
import { apiErrorMessage } from "@/lib/alert";
import { api, type SignupRequest } from "@/lib/api";
import { DISABLED_OPACITY } from "@/lib/design";

const BOTTOM_BAR_HEIGHT = 80;

const MINOR_NOTICE =
  "미성년자는 가입할 수 없습니다. 적발 시 서비스 이용이 제한됩니다.";

const TERMS_URL = "https://jipkok.app/terms";
const PRIVACY_URL = "https://jipkok.app/privacy";
const BROWSER_FAILED_MESSAGE = "페이지를 열지 못했습니다.";
const CODE_SENT_MESSAGE = "인증번호가 전송되었습니다.";

const PHONE_NUMBER_PATTERN = /^010\d{8}$/;
const VERIFICATION_CODE_PATTERN = /^\d{6}$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 30;

const GENDERS = [
  { value: "MALE", label: "남자" },
  { value: "FEMALE", label: "여자" },
] as const;

type AlertState = {
  variant: RetroAlertVariant;
  title: string;
  message: string;
};

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const { control, handleSubmit } = useForm<SignupRequest>({
    defaultValues: {
      phoneNumber: "",
      verificationCode: "",
      password: "",
      passwordConfirm: "",
    },
  });

  const [alert, setAlert] = useState<AlertState | null>({
    variant: "warning",
    title: "경고",
    message: MINOR_NOTICE,
  });

  const showError = (message: string) =>
    setAlert({ variant: "error", title: "에러", message });

  const openLegal = (url: string) =>
    WebBrowser.openBrowserAsync(url).catch(() =>
      showError(BROWSER_FAILED_MESSAGE),
    );

  const sendCode = useMutation({
    mutationFn: api.auth.sendVerificationCode,
    onSuccess: () =>
      setAlert({ variant: "info", title: "알림", message: CODE_SENT_MESSAGE }),
    onError: (error) => showError(apiErrorMessage(error)),
  });

  const signup = useMutation({
    mutationFn: api.members.signup,
    onSuccess: () => router.replace("/setup"),
    onError: (error) => showError(apiErrorMessage(error)),
  });

  const phoneNumber = useWatch({ control, name: "phoneNumber" });

  const canSendCode =
    PHONE_NUMBER_PATTERN.test(phoneNumber) && !sendCode.isPending;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        mode="layout"
        bottomOffset={BOTTOM_BAR_HEIGHT}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <YStack gap="$4" p="$4" pb={BOTTOM_BAR_HEIGHT}>
          <XStack gap="$2" items="flex-start">
            <YStack flex={1}>
              <ControlledInput
                control={control}
                name="phoneNumber"
                input={RetroInput}
                rules={{
                  required: "휴대폰 번호를 입력해주시길 바랍니다.",
                  pattern: {
                    value: PHONE_NUMBER_PATTERN,
                    message: "휴대폰 번호가 올바르지 않습니다.",
                  },
                }}
                placeholder="휴대폰 번호"
                keyboardType="number-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                maxLength={11}
              />
            </YStack>

            <RetroButton
              disabled={!canSendCode}
              opacity={canSendCode ? 1 : DISABLED_OPACITY}
              onPress={() => sendCode.mutate(phoneNumber)}
            >
              전송
            </RetroButton>
          </XStack>

          <ControlledInput
            control={control}
            name="verificationCode"
            input={RetroInput}
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
            input={RetroInput}
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
            }}
            placeholder="비밀번호"
            secureTextEntry
            textContentType="newPassword"
            autoComplete="new-password"
            autoCapitalize="none"
          />

          <ControlledInput
            control={control}
            name="passwordConfirm"
            input={RetroInput}
            rules={{
              required: "비밀번호를 한 번 더 입력해주시길 바랍니다.",
              validate: (value, values) =>
                value === values.password || "비밀번호가 일치하지 않습니다.",
            }}
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
                      theme={field.value === value ? "blue" : "gray"}
                      onPress={() => field.onChange(value)}
                    >
                      {label}
                    </RetroButton>
                  ))}
                </XStack>
              </FormField>
            )}
          />
        </YStack>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <YStack px="$4" py="$4" bg="$background">
          <RetroButton
            disabled={signup.isPending}
            opacity={signup.isPending ? DISABLED_OPACITY : 1}
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
        </YStack>
      </KeyboardStickyView>

      <RetroAlert
        visible={alert !== null}
        variant={alert?.variant}
        title={alert?.title ?? ""}
        message={alert?.message ?? ""}
        onClose={() => setAlert(null)}
      />
    </SafeAreaView>
  );
}
