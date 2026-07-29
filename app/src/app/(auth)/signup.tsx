import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Button, Input, Text, XStack, YStack } from "tamagui";

const BOTTOM_BAR_HEIGHT = 80;

export default function SignupScreen() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        bottomOffset={BOTTOM_BAR_HEIGHT}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <YStack gap="$4" p="$4" pb={BOTTOM_BAR_HEIGHT}>
          <YStack gap="$2">
            <XStack gap="$2">
              <Input
                flex={1}
                size="$4"
                theme="gray"
                bg="$color4"
                placeholder="휴대폰 번호"
                borderWidth="$0"
              />
              <Button size="$4" theme="gray" bg="$color4">
                전송
              </Button>
            </XStack>
            <Text theme="red" color="$color10">
              휴대폰 번호가 올바르지 않습니다.
            </Text>
          </YStack>

          <YStack gap="$2">
            <Input
              size="$4"
              theme="gray"
              bg="$color4"
              placeholder="인증 번호"
              borderWidth="$0"
            />
            <Text theme="red" color="$color10">
              인증 번호가 올바르지 않습니다.
            </Text>
          </YStack>

          <YStack gap="$2">
            <YStack gap="$2">
              <Input
                size="$4"
                placeholder="비밀번호"
                borderWidth="$0"
                theme="gray"
                bg="$color4"
                secureTextEntry
              />
              <Input
                size="$4"
                placeholder="비밀번호 확인"
                borderWidth="$0"
                theme="gray"
                bg="$color4"
                secureTextEntry
              />
            </YStack>
            <Text theme="red" color="$color10">
              비밀번호가 올바르지 않습니다.
            </Text>
          </YStack>

          <YStack gap="$2">
            <XStack gap="$2">
              <Button flex={1} size="$4" theme="gray" bg="$color4">
                남자
              </Button>
              <Button flex={1} size="$4" theme="gray" bg="$color4">
                여자
              </Button>
            </XStack>
            <Text theme="red" color="$color10">
              성별을 선택해주시길 바랍니다.
            </Text>
          </YStack>
        </YStack>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <YStack px="$4" py="$4" bg="$background">
          <Button size="$4" theme="blue">
            회원가입
          </Button>
        </YStack>
      </KeyboardStickyView>
    </SafeAreaView>
  );
}
