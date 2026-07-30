import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Button, XStack, YStack } from "tamagui";

import { FormButton } from "@/components/FormButton";
import { FormField } from "@/components/FormField";
import { FormInput } from "@/components/FormInput";

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
          <FormField error="휴대폰 번호가 올바르지 않습니다.">
            <XStack gap="$2">
              <FormInput
                flex={1}
                placeholder="휴대폰 번호"
                keyboardType="number-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                maxLength={11}
              />
              <FormButton>전송</FormButton>
            </XStack>
          </FormField>

          <FormField error="인증 번호가 올바르지 않습니다.">
            <FormInput
              placeholder="인증 번호"
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              maxLength={6}
            />
          </FormField>

          <FormField error="비밀번호가 올바르지 않습니다.">
            <YStack gap="$2">
              <FormInput
                placeholder="비밀번호"
                secureTextEntry
                textContentType="newPassword"
                autoComplete="new-password"
                autoCapitalize="none"
              />
              <FormInput
                placeholder="비밀번호 확인"
                secureTextEntry
                textContentType="newPassword"
                autoComplete="new-password"
                autoCapitalize="none"
              />
            </YStack>
          </FormField>

          <FormField error="성별을 선택해주시길 바랍니다.">
            <XStack gap="$2">
              <FormButton flex={1}>남자</FormButton>
              <FormButton flex={1}>여자</FormButton>
            </XStack>
          </FormField>
        </YStack>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <YStack px="$4" py="$4" bg="$background">
          <Button size="$4" theme="blue" rounded="$7">
            회원가입
          </Button>
        </YStack>
      </KeyboardStickyView>
    </SafeAreaView>
  );
}
