import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import { ControlledInput } from "@/components/ControlledInput";
import { FormScreen } from "@/components/FormScreen";
import { PhoneNumberField } from "@/components/PhoneNumberField";
import { SendCodeButton } from "@/components/SendCodeButton";
import { Button } from "@/components/ui/Button";
import { useAlert } from "@/hooks/useAlert";
import { useVerificationCode } from "@/hooks/useVerificationCode";
import { api, type ResetPasswordRequest } from "@/lib/api";
import { showToast } from "@/lib/toast/store";
import {
  PASSWORD_CONFIRM_RULES,
  PASSWORD_RULES,
  VERIFICATION_CODE_RULES,
} from "@/lib/validation";

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

  const { alertElement, showApiError } = useAlert();

  const code = useVerificationCode({
    purpose: "PASSWORD_RESET",
    onError: showApiError,
  });

  const reset = useMutation({
    mutationFn: api.auth.resetPassword,
    onSuccess: (_data, { phoneNumber }) => {
      router.dismissTo({ pathname: "/login", params: { phoneNumber } });
      showToast("info", t("auth.password.resetMessage"));
    },
    onError: showApiError,
  });

  const phoneNumber = useWatch({ control, name: "phoneNumber" });

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <FormScreen
        scrollMode="layout"
        footer={
          <Button
            size="xlarge"
            loading={reset.isPending}
            onPress={handleSubmit((values) => reset.mutate(values))}
          >
            {t("auth.password.submit")}
          </Button>
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
