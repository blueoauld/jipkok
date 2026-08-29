import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner } from "tamagui";

import { ControlledInput } from "@/components/ControlledInput";
import { FormScreen } from "@/components/FormScreen";
import { PhoneNumberField } from "@/components/PhoneNumberField";
import { RetroButton } from "@/components/ui/RetroButton";
import { useCountdown } from "@/hooks/useCountdown";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { api, type ResetPasswordRequest } from "@/lib/api";
import { formatCountdown } from "@/lib/date";
import { SEND_CODE_BUTTON_MIN_WIDTH } from "@/lib/design";
import { codeSentMessage } from "@/lib/message";
import { patternOf, usePhoneCountry } from "@/lib/phone";
import { showToast } from "@/lib/toast/store";
import {
  PASSWORD_CONFIRM_RULES,
  PASSWORD_RULES,
  VERIFICATION_CODE_RULES,
} from "@/lib/validation";

// 서버 VerificationCodeService.RESEND_COOLDOWN과 같다.
const RESEND_COOLDOWN_SECONDS = 30;

// 서버 VerificationCodeService.CODE_TIME_TO_LIVE와 같다.
const CODE_TIME_TO_LIVE_SECONDS = 180;

const PURPOSE = "PASSWORD_RESET";

export default function PasswordScreen() {
  const { t } = useTranslation();
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
  const expiry = useCountdown();

  const sendCode = useMutation({
    mutationFn: (phoneNumber: string) =>
      api.auth.sendVerificationCode(phoneNumber, PURPOSE),
    onSuccess: () => {
      cooldown.start(RESEND_COOLDOWN_SECONDS);
      expiry.start(CODE_TIME_TO_LIVE_SECONDS);
      showToast("info", codeSentMessage());
    },
    onError: showApiError,
  });

  const reset = useMutation({
    mutationFn: api.auth.resetPassword,
    onSuccess: () => {
      router.back();
      showToast("info", t("auth.password.resetMessage"));
    },
    onError: showApiError,
  });

  const country = usePhoneCountry();
  const phoneNumber = useWatch({ control, name: "phoneNumber" });

  const canSendCode =
    patternOf(country).test(phoneNumber) &&
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
            {reset.isPending ? (
              <Spinner color="white" />
            ) : (
              t("auth.password.submit")
            )}
          </RetroButton>
        }
      >
        <PhoneNumberField
          control={control}
          name="phoneNumber"
          right={
            <RetroButton
              minW={SEND_CODE_BUTTON_MIN_WIDTH}
              disabled={!canSendCode}
              onPress={() => sendCode.mutate(phoneNumber)}
            >
              {sendCode.isPending ? (
                <Spinner color="white" />
              ) : expiry.remaining > 0 ? (
                formatCountdown(expiry.remaining)
              ) : (
                t("auth.sendCode")
              )}
            </RetroButton>
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
          placeholder={t("auth.password.newPlaceholder")}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          autoCapitalize="none"
        />

        <ControlledInput
          control={control}
          name="passwordConfirm"
          rules={PASSWORD_CONFIRM_RULES}
          placeholder={t("auth.password.newConfirmPlaceholder")}
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
