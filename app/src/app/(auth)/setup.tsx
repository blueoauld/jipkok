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
          <YStack gap="$2">
            <Input
              size="$4"
              theme="gray"
              bg="$color4"
              placeholder="닉네임"
              borderWidth="$0"
            />
            <Text theme="red" color="$color10">
              닉네임이 올바르지 않습니다.
            </Text>
          </YStack>

          <YStack gap="$2">
            <Input
              size="$4"
              theme="gray"
              bg="$color4"
              placeholder="출생연도"
              borderWidth="$0"
            />
            <Text theme="red" color="$color10">
              출생연도가 올바르지 않습니다.
            </Text>
          </YStack>

          <YStack gap="$2">
            <Input
              multiline
              size="$4"
              rows={7}
              textAlignVertical="top"
              placeholder="자기소개"
              borderWidth="$0"
              theme="gray"
              bg="$color4"
            />
            <XStack justify="space-between">
              <Text theme="red" color="$color10">
                부적절한 내용이 포함되어있습니다.
              </Text>
              <Text theme="gray" color="$color10">
                1 / 1000
              </Text>
            </XStack>
          </YStack>
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
