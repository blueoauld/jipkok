import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Button, Text, YStack } from "tamagui";

import { FormField } from "@/components/FormField";
import { FormInput } from "@/components/FormInput";

const BOTTOM_BAR_HEIGHT = 80;

export default function SetupScreen() {
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
          <FormField error="닉네임이 올바르지 않습니다.">
            <FormInput placeholder="닉네임" />
          </FormField>

          <FormField error="출생연도가 올바르지 않습니다.">
            <FormInput placeholder="출생연도" />
          </FormField>

          <FormField
            error="부적절한 내용이 포함되어있습니다."
            right={
              <Text theme="gray" color="$color10">
                1 / 1000
              </Text>
            }
          >
            <FormInput
              multiline
              rows={7}
              textAlignVertical="top"
              placeholder="자기소개"
            />
          </FormField>
        </YStack>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <YStack px="$4" py="$4" bg="$background">
          <Button size="$4" theme="blue">
            들어가기
          </Button>
        </YStack>
      </KeyboardStickyView>
    </SafeAreaView>
  );
}
