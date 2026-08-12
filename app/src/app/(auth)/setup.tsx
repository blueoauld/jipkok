import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, Text } from "tamagui";

import { ControlledInput } from "@/components/ControlledInput";
import { FormScreen } from "@/components/FormScreen";
import { RetroButton } from "@/components/ui/RetroButton";
import { useBlockGoBack } from "@/hooks/useBlockGoBack";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { api } from "@/lib/api";
import { DISABLED_OPACITY } from "@/lib/design";
import {
  BIO_MAX_LENGTH,
  BIRTH_YEAR_LENGTH,
  BIRTH_YEAR_RULES,
  NICKNAME_MAX_LENGTH,
  NICKNAME_RULES,
} from "@/lib/validation";

type SetupForm = {
  nickname: string;
  birthYear: string;
  bio: string;
};

export default function SetupScreen() {
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
      <FormScreen
        scrollMode="layout"
        footer={
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
        }
      >
        <ControlledInput
          control={control}
          name="nickname"
          rules={NICKNAME_RULES}
          placeholder="닉네임"
          maxLength={NICKNAME_MAX_LENGTH}
          textContentType="nickname"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <ControlledInput
          control={control}
          name="birthYear"
          rules={BIRTH_YEAR_RULES}
          placeholder="출생연도"
          keyboardType="number-pad"
          maxLength={BIRTH_YEAR_LENGTH}
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
      </FormScreen>

      {alertElement}
    </SafeAreaView>
  );
}
