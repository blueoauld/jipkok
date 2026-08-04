import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Button, Text, XStack, YStack } from "tamagui";

import { ControlledInput } from "@/components/ControlledInput";
import { FormButton } from "@/components/FormButton";
import { FormField } from "@/components/FormField";
import { alertApiError, alertInfo, alertMessage } from "@/lib/alert";
import { api, type SignupRequest } from "@/lib/api";

const BOTTOM_BAR_HEIGHT = 80;

const MINOR_NOTICE =
  "미성년자는 가입할 수 없습니다. 적발 시 서비스 이용이 제한됩니다.";

const TERMS_URL = "https://jipkok.app/terms";
const PRIVACY_URL = "https://jipkok.app/privacy";
const BROWSER_FAILED_MESSAGE = "페이지를 열지 못했습니다.";

const PHONE_NUMBER_PATTERN = /^010\d{8}$/;
const VERIFICATION_CODE_PATTERN = /^\d{6}$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 30;

const GENDERS = [
  { value: "MALE", label: "남자" },
  { value: "FEMALE", label: "여자" },
] as const;

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const { control, handleSubmit, watch, getValues } = useForm<SignupRequest>({
    defaultValues: {
      phoneNumber: "",
      verificationCode: "",
      password: "",
      passwordConfirm: "",
    },
  });

  useEffect(() => {
    alertInfo(MINOR_NOTICE);
  }, []);

  const openLegal = (url: string) =>
    WebBrowser.openBrowserAsync(url).catch(() =>
      alertMessage(BROWSER_FAILED_MESSAGE),
    );

  const sendCode = useMutation({
    mutationFn: api.auth.sendVerificationCode,
    onSuccess: () => Alert.alert("알림", "인증번호를 보냈습니다."),
    onError: alertApiError,
  });

  const signup = useMutation({
    mutationFn: api.members.signup,
    onSuccess: () => router.replace("/setup"),
    onError: alertApiError,
  });

  const canSendCode =
    PHONE_NUMBER_PATTERN.test(watch("phoneNumber")) && !sendCode.isPending;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
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

            <FormButton
              disabled={!canSendCode}
              opacity={canSendCode ? 1 : 0.6}
              onPress={() => sendCode.mutate(getValues("phoneNumber"))}
            >
              전송
            </FormButton>
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
                <XStack gap="$2">
                  {GENDERS.map(({ value, label }) => (
                    <FormButton
                      key={value}
                      flex={1}
                      theme={field.value === value ? "blue" : undefined}
                      onPress={() => field.onChange(value)}
                    >
                      {label}
                    </FormButton>
                  ))}
                </XStack>
              </FormField>
            )}
          />
        </YStack>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <YStack px="$4" py="$4" bg="$background">
          <Button
            size="$4"
            theme="blue"
            rounded="$7"
            disabled={signup.isPending}
            opacity={signup.isPending ? 0.6 : 1}
            onPress={handleSubmit((values) => signup.mutate(values))}
          >
            회원가입
          </Button>

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
    </SafeAreaView>
  );
}
