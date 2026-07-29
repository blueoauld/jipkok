import { Link } from "expo-router";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, YStack } from "tamagui";

import { FormField } from "@/components/FormField";
import { FormInput } from "@/components/FormInput";

export default function LoginScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        automaticOffset
      >
        <YStack flex={1} justify="space-between" p="$4">
          <YStack gap="$4">
            <FormField error="휴대폰 번호가 올바르지 않습니다.">
              <FormInput placeholder="휴대폰 번호" />
            </FormField>

            <FormField error="비밀번호가 올바르지 않습니다.">
              <FormInput placeholder="비밀번호" secureTextEntry />
            </FormField>

            <Link href="/signup" asChild>
              <Text
                theme="blue"
                color="$color10"
                self="center"
                pressStyle={{ opacity: 0.6 }}
              >
                회원가입
              </Text>
            </Link>
          </YStack>

          <Button size="$4" theme="blue">
            로그인
          </Button>
        </YStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
