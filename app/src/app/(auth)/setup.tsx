import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Spinner, Text, YStack } from "tamagui";

import { ControlledInput } from "@/components/ControlledInput";
import { RetroButton } from "@/components/ui/RetroButton";
import { useBlockGoBack } from "@/hooks/useBlockGoBack";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { api } from "@/lib/api";
import { DISABLED_OPACITY } from "@/lib/design";
import { validateBirthYear } from "@/lib/member";
import { NICKNAME_PATTERN } from "@/lib/validation";

const BOTTOM_BAR_HEIGHT = 80;

const NICKNAME_MAX_LENGTH = 10;
const BIO_MAX_LENGTH = 1000;

type SetupForm = {
  nickname: string;
  birthYear: string;
  bio: string;
};

export default function SetupScreen() {
  const insets = useSafeAreaInsets();
  const { control, handleSubmit } = useForm<SetupForm>({
    defaultValues: { nickname: "", birthYear: "", bio: "" },
  });

  useBlockGoBack();

  const { alertElement, showApiError } = useRetroAlert();

  const setupProfile = useMutation({
    mutationFn: api.members.setupProfile,
    onSuccess: () => router.replace("/main"),
    onError: showApiError,
  });

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        mode="layout"
        bottomOffset={BOTTOM_BAR_HEIGHT}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <YStack gap="$4" p="$4" pb={BOTTOM_BAR_HEIGHT}>
          <ControlledInput
            control={control}
            name="nickname"
            rules={{
              required: "닉네임을 입력해주시길 바랍니다.",
              pattern: {
                value: NICKNAME_PATTERN,
                message: "닉네임이 올바르지 않습니다.",
              },
              validate: (value) =>
                value.trim().length > 0 || "닉네임을 입력해주시길 바랍니다.",
            }}
            placeholder="닉네임"
            maxLength={NICKNAME_MAX_LENGTH}
            textContentType="nickname"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <ControlledInput
            control={control}
            name="birthYear"
            rules={{
              required: "출생연도를 입력해주시길 바랍니다.",
              pattern: {
                value: /^\d{4}$/,
                message: "출생연도가 올바르지 않습니다.",
              },
              validate: validateBirthYear,
            }}
            placeholder="출생연도"
            keyboardType="number-pad"
            maxLength={4}
          />

          <ControlledInput
            control={control}
            name="bio"
            rules={{
              maxLength: {
                value: BIO_MAX_LENGTH,
                message: "자기소개가 너무 깁니다.",
              },
            }}
            renderRight={(value) => (
              <Text theme="gray" color="$color11">
                {`${value.length} / ${BIO_MAX_LENGTH}`}
              </Text>
            )}
            multiline
            rows={7}
            textAlignVertical="top"
            placeholder="자기소개"
            maxLength={BIO_MAX_LENGTH}
          />
        </YStack>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <YStack px="$4" py="$4" bg="$background">
          <RetroButton
            disabled={setupProfile.isPending}
            opacity={setupProfile.isPending ? DISABLED_OPACITY : 1}
            onPress={handleSubmit((values) =>
              setupProfile.mutate({
                nickname: values.nickname.trim(),
                birthYear: Number(values.birthYear),
                bio: values.bio || undefined,
              }),
            )}
          >
            {setupProfile.isPending ? <Spinner color="white" /> : "들어가기"}
          </RetroButton>
        </YStack>
      </KeyboardStickyView>

      {alertElement}
    </SafeAreaView>
  );
}
