import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, Text } from "tamagui";

import { ControlledInput } from "@/components/ControlledInput";
import { FormScreen } from "@/components/FormScreen";
import { RetroButton } from "@/components/ui/RetroButton";
import { useBlockGoBack } from "@/hooks/useBlockGoBack";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { APP_EVENT, logAppEvent } from "@/lib/analytics";
import { api } from "@/lib/api";
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
  const { t } = useTranslation();
  const { control, handleSubmit } = useForm<SetupForm>({
    defaultValues: { nickname: "", birthYear: "", bio: "" },
  });

  useBlockGoBack();

  const { alertElement, showApiError } = useRetroAlert();

  const setupProfile = useMutation({
    mutationFn: api.members.setupProfile,
    onSuccess: () => {
      logAppEvent(APP_EVENT.profileSetupCompleted);
      router.replace("/main");
    },
    onError: showApiError,
  });

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <FormScreen
        scrollMode="layout"
        footer={
          <RetroButton
            disabled={setupProfile.isPending}
            onPress={handleSubmit((values) =>
              setupProfile.mutate({
                nickname: values.nickname.trim(),
                birthYear: Number(values.birthYear),
                bio: values.bio || undefined,
              }),
            )}
          >
            {setupProfile.isPending ? (
              <Spinner color="white" />
            ) : (
              t("auth.setup.submit")
            )}
          </RetroButton>
        }
      >
        <ControlledInput
          control={control}
          name="nickname"
          rules={NICKNAME_RULES}
          placeholder={t("auth.setup.nicknamePlaceholder")}
          maxLength={NICKNAME_MAX_LENGTH}
          textContentType="nickname"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <ControlledInput
          control={control}
          name="birthYear"
          rules={BIRTH_YEAR_RULES}
          placeholder={t("auth.setup.birthYearPlaceholder")}
          keyboardType="number-pad"
          maxLength={BIRTH_YEAR_LENGTH}
        />

        <ControlledInput
          control={control}
          name="bio"
          rules={{
            maxLength: {
              value: BIO_MAX_LENGTH,
              message: t("auth.setup.bioTooLong"),
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
          placeholder={t("auth.setup.bioPlaceholder")}
          maxLength={BIO_MAX_LENGTH}
        />
      </FormScreen>

      {alertElement}
    </SafeAreaView>
  );
}
