import { useMutation } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import { useForm } from "react-hook-form";
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
              placeholder="휴대폰 번호"
              keyboardType="number-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              maxLength={11}
            />

            <ControlledInput
              control={control}
              name="password"
              rules={{ required: "비밀번호를 입력해주시길 바랍니다." }}
              placeholder="비밀번호"
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
                  회원가입
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
                  비밀번호 찾기
                </Text>
              </Link>
            </XStack>
          </YStack>

          <RetroButton
            disabled={login.isPending}
            onPress={handleSubmit((values) => login.mutate(values))}
          >
            {login.isPending ? <Spinner color="white" /> : "로그인"}
          </RetroButton>
        </YStack>
      </KeyboardAvoidingView>

      {alertElement}
    </SafeAreaView>
  );
}
