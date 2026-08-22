import { useMutation } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, Text, XStack, YStack } from "tamagui";

import { ControlledInput } from "@/components/ControlledInput";
import { RetroButton } from "@/components/ui/RetroButton";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { api, type LoginRequest } from "@/lib/api";
import { PRESS_OPACITY } from "@/lib/design";
import { useAccent } from "@/lib/theme/accent";
import { PHONE_NUMBER_RULES } from "@/lib/validation";

export default function LoginScreen() {
  const { t } = useTranslation();
  const { control, handleSubmit } = useForm<LoginRequest>({
    defaultValues: { phoneNumber: "", password: "" },
  });

  const { alertElement, showApiError } = useRetroAlert();
  const accent = useAccent();

  const login = useMutation({
    mutationFn: api.auth.login,
    onSuccess: () => router.replace("/main"),
    onError: showApiError,
  });

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        automaticOffset
      >
        <YStack flex={1} justify="space-between" p="$4">
          <YStack gap="$4">
            <ControlledInput
              control={control}
              name="phoneNumber"
              rules={PHONE_NUMBER_RULES}
              placeholder={t("auth.phoneNumberPlaceholder")}
              keyboardType="number-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              maxLength={11}
              clearable
            />

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
          </YStack>

          <RetroButton
            disabled={login.isPending}
            onPress={handleSubmit((values) => login.mutate(values))}
          >
            {login.isPending ? (
              <Spinner color="white" />
            ) : (
              t("auth.login.submit")
            )}
          </RetroButton>
        </YStack>
      </KeyboardAvoidingView>

      {alertElement}
    </SafeAreaView>
  );
}
