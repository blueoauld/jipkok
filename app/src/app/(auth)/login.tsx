import { useMutation } from "@tanstack/react-query";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, Text, XStack } from "tamagui";

import { ControlledInput } from "@/components/ControlledInput";
import { FormScreen } from "@/components/FormScreen";
import { PhoneNumberField } from "@/components/PhoneNumberField";
import { RetroButton } from "@/components/ui/RetroButton";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { api, type LoginRequest } from "@/lib/api";
import { PRESS_OPACITY } from "@/lib/design";
import { useAccent } from "@/lib/theme/accent";

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

  const { alertElement, showApiError } = useRetroAlert();
  const accent = useAccent();

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
          <RetroButton
            disabled={login.isPending}
            onPress={handleSubmit((values) => login.mutate(values))}
          >
            {login.isPending ? (
              <Spinner color="$color11" />
            ) : (
              t("auth.login.submit")
            )}
          </RetroButton>
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

        <XStack justify="center" items="center" gap="$3" mt="$2">
          <Link href="/signup" asChild>
            <Text
              theme={accent}
              color="$color10"
              fontSize="$4"
              textDecorationLine="underline"
              pressStyle={{ opacity: PRESS_OPACITY }}
            >
              {t("auth.login.signup")}
            </Text>
          </Link>

          <Text theme="gray" color="$color8" fontSize="$4">
            |
          </Text>

          <Link href="/password" asChild>
            <Text
              theme={accent}
              color="$color10"
              fontSize="$4"
              textDecorationLine="underline"
              pressStyle={{ opacity: PRESS_OPACITY }}
            >
              {t("auth.login.findPassword")}
            </Text>
          </Link>
        </XStack>
      </FormScreen>

      {alertElement}
    </SafeAreaView>
  );
}
