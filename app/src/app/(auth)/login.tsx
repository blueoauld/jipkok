import { Link } from "expo-router";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input, Text, YStack } from "tamagui";

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
            <YStack gap="$2">
              <Input size="$4" placeholder="휴대폰 번호" />
              <Text theme="red" color="$color10">
                휴대폰 번호가 올바르지 않습니다.
              </Text>
            </YStack>

            <YStack gap="$2">
              <Input size="$4" placeholder="비밀번호" secureTextEntry />
              <Text theme="red" color="$color10">
                비밀번호가 올바르지 않습니다.
              </Text>
            </YStack>

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
