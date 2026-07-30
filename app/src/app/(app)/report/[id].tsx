import { Stack, useLocalSearchParams } from "expo-router";
import { CheckIcon } from "phosphor-react-native";
import { useState } from "react";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Button, Text, useTheme, XStack, YStack } from "tamagui";

import { FormField } from "@/components/FormField";
import { FormInput } from "@/components/FormInput";

const BOTTOM_BAR_HEIGHT = 80;
const DETAIL_MAX_LENGTH = 1000;

const REASONS = [
  "음란물",
  "미성년자",
  "금전거래",
  "욕설 및 협박",
  "사칭 및 도용",
  "기타",
];

function ReasonRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <XStack
      items="center"
      justify="space-between"
      px="$4"
      py="$3"
      pressStyle={{ bg: "$gray5" }}
      onPress={onPress}
    >
      <Text flex={1} numberOfLines={1} fontSize="$4">
        {label}
      </Text>

      <XStack opacity={selected ? 1 : 0}>
        <CheckIcon size={20} weight="bold" color={theme.color.val} />
      </XStack>
    </XStack>
  );
}

export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<string | null>(null);
  const [detail, setDetail] = useState("");

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={{ title: "신고하기" }} />

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        bottomOffset={BOTTOM_BAR_HEIGHT}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <YStack gap="$4" p="$4" pb={BOTTOM_BAR_HEIGHT}>
          <YStack bg="$gray4" rounded="$7" overflow="hidden">
            {REASONS.map((label) => (
              <ReasonRow
                key={label}
                label={label}
                selected={label === reason}
                onPress={() => setReason(label)}
              />
            ))}
          </YStack>

          <FormField
            right={
              <Text theme="gray" color="$color10">
                {`${detail.length} / ${DETAIL_MAX_LENGTH}`}
              </Text>
            }
          >
            <FormInput
              multiline
              rows={7}
              textAlignVertical="top"
              placeholder="상세 내용"
              maxLength={DETAIL_MAX_LENGTH}
              value={detail}
              onChangeText={setDetail}
            />
          </FormField>
        </YStack>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <YStack px="$4" py="$4" bg="$background">
          <Button size="$4" theme="red" rounded="$7" disabled={!reason}>
            신고하기
          </Button>
        </YStack>
      </KeyboardStickyView>
    </SafeAreaView>
  );
}
