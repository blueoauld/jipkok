import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, Text, XStack } from "tamagui";

import { ControlledInput } from "@/components/ControlledInput";
import { FormField } from "@/components/FormField";
import { FormScreen } from "@/components/FormScreen";
import { PhoneNumberField } from "@/components/PhoneNumberField";
import { SendCodeButton } from "@/components/SendCodeButton";
import { RetroButton } from "@/components/ui/RetroButton";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { useVerificationCode } from "@/hooks/useVerificationCode";
import { APP_EVENT, logAppEvent, logSignUp } from "@/lib/analytics";
import { api, apiErrorCode, type SignupRequest } from "@/lib/api";
import { genderLabel } from "@/lib/member";
import { openWebPage, PRIVACY_URL, TERMS_URL } from "@/lib/support";
import { useAccent } from "@/lib/theme/accent";
import {
  PASSWORD_CONFIRM_RULES,
  PASSWORD_RULES,
  VERIFICATION_CODE_RULES,
} from "@/lib/validation";

const SIGN_UP_METHOD = "phone";

const GENDERS = ["MALE", "FEMALE"] as const;

export default function SignupScreen() {
  const { t } = useTranslation();
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
    message: t("auth.signup.minorNotice"),
  });

  const accent = useAccent();

  const openLegal = (url: string) => openWebPage(url, show);

  const code = useVerificationCode({
    purpose: "SIGNUP",
    onSent: () => logAppEvent(APP_EVENT.verificationCodeSent),
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
              {signup.isPending ? (
                <Spinner color="white" />
              ) : (
                t("auth.signup.submit")
              )}
            </RetroButton>

            <XStack justify="center" items="center" gap="$2" pt="$3">
              <Text
                theme="gray"
                color="$color11"
                fontSize="$2"
                onPress={() => openLegal(PRIVACY_URL)}
              >
                {t("legal.privacy")}
              </Text>
              <Text theme="gray" color="$color8" fontSize="$2">
                |
              </Text>
              <Text
                theme="gray"
                color="$color11"
                fontSize="$2"
                onPress={() => openLegal(TERMS_URL)}
              >
                {t("legal.terms")}
              </Text>
            </XStack>
          </>
        }
      >
        <PhoneNumberField
          control={control}
          name="phoneNumber"
          right={
            <SendCodeButton
              sending={code.sending}
              remaining={code.expiryRemaining}
              disabled={!code.canSend(phoneNumber)}
              onPress={() => code.send(phoneNumber)}
            />
          }
        />

        <ControlledInput
          control={control}
          name="verificationCode"
          rules={VERIFICATION_CODE_RULES}
          placeholder={t("auth.codePlaceholder")}
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
          placeholder={t("auth.passwordPlaceholder")}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          autoCapitalize="none"
        />

        <ControlledInput
          control={control}
          name="passwordConfirm"
          rules={PASSWORD_CONFIRM_RULES}
          placeholder={t("auth.signup.passwordConfirmPlaceholder")}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          autoCapitalize="none"
        />

        <Controller
          control={control}
          name="gender"
          rules={{ required: t("auth.signup.genderRequired") }}
          render={({ field, fieldState }) => (
            <FormField error={fieldState.error?.message}>
              <XStack gap="$3">
                {GENDERS.map((gender) => (
                  <RetroButton
                    key={gender}
                    flex={1}
                    theme={field.value === gender ? accent : "gray"}
                    onPress={() => field.onChange(gender)}
                  >
                    {genderLabel(gender)}
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
