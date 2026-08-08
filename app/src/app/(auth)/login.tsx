import { useMutation } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import { useForm } from "react-hook-form";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, YStack } from "tamagui";

import { ControlledInput } from "@/components/ControlledInput";
import { alertApiError } from "@/lib/alert";
import { api, type LoginRequest } from "@/lib/api";
import { DISABLED_OPACITY, PRESS_OPACITY } from "@/lib/design";

const PHONE_NUMBER_PATTERN = /^010\d{8}$/;
const PASSWORD_MIN_LENGTH = 8;

export default function LoginScreen() {
  const { control, handleSubmit } = useForm<LoginRequest>({
    defaultValues: { phoneNumber: "", password: "" },
  });

  const login = useMutation({
    mutationFn: api.auth.login,
    onSuccess: () => router.replace("/main"),
    onError: alertApiError,
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

            <ControlledInput
              control={control}
              name="password"
              rules={{
                required: "비밀번호를 입력해주시길 바랍니다.",
                minLength: {
                  value: PASSWORD_MIN_LENGTH,
                  message: "비밀번호가 올바르지 않습니다.",
                },
              }}
              placeholder="비밀번호"
              secureTextEntry
              textContentType="password"
              autoComplete="current-password"
              autoCapitalize="none"
            />

            <Link href="/signup" asChild>
              <Text
                theme="blue"
                color="$color10"
                self="center"
                pressStyle={{ opacity: PRESS_OPACITY }}
              >
                회원가입
              </Text>
            </Link>
          </YStack>

          <Button
            size="$4"
            theme="blue"
            rounded="$7"
            opacity={login.isPending ? DISABLED_OPACITY : 1}
            onPress={handleSubmit((values) => {
              if (!login.isPending) {
                login.mutate(values);
              }
            })}
          >
            로그인
          </Button>
        </YStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
