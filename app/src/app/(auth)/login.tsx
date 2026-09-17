import { useMutation } from "@tanstack/react-query";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { XStack } from "tamagui";

import { ControlledInput } from "@/components/ControlledInput";
import { FormScreen } from "@/components/FormScreen";
import { PhoneNumberField } from "@/components/PhoneNumberField";
import { Button } from "@/components/ui/Button";
import { TextButton, TextButtonDivider } from "@/components/ui/TextButton";
import { useAlert } from "@/hooks/useAlert";
import { api, type LoginRequest } from "@/lib/api";

export default function LoginScreen() {
  const { t } = useTranslation();
  const { control, handleSubmit, setValue } = useForm<LoginRequest>({
    defaultValues: { phoneNumber: "", password: "" },
  });
  // 비밀번호를 바꾸고 돌아오면 방금 인증한 번호를 채워 둔다.
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber?: string }>();

  useEffect(() => {
    if (phoneNumber) {
      setValue("phoneNumber", phoneNumber);
    }
  }, [phoneNumber, setValue]);

  const { alertElement, showApiError } = useAlert();

  const login = useMutation({
    mutationFn: api.auth.login,
    onSuccess: () => router.replace("/main"),
    onError: showApiError,
  });

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <FormScreen
        scrollMode="layout"
        footer={
          <Button
            size="xlarge"
            loading={login.isPending}
            onPress={handleSubmit((values) => login.mutate(values))}
          >
            {t("auth.login.submit")}
          </Button>
        }
      >
        <PhoneNumberField control={control} name="phoneNumber" />

        <ControlledInput
          control={control}
          name="password"
          rules={{ required: t("validation.passwordRequired") }}
          placeholder={t("auth.passwordPlaceholder")}
          secureTextEntry
          textContentType="password"
          autoComplete="current-password"
          autoCapitalize="none"
        />

        <XStack justify="center" items="center" mt="$2">
          <Link href="/signup" asChild>
            <TextButton>{t("auth.login.signup")}</TextButton>
          </Link>

          <TextButtonDivider />

          <Link href="/password" asChild>
            <TextButton>{t("auth.login.findPassword")}</TextButton>
          </Link>
        </XStack>
      </FormScreen>

      {alertElement}
    </SafeAreaView>
  );
}
