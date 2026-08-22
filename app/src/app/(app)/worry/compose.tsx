import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, Text, YStack } from "tamagui";

import { FormScreen } from "@/components/FormScreen";
import { CountedInput } from "@/components/ui/CountedInput";
import { RetroButton } from "@/components/ui/RetroButton";
import { WorryCategoryPicker } from "@/components/worry/WorryCategoryChips";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { WORRIES_KEY } from "@/hooks/useWorryPosts";
import { api, type WorryCategory } from "@/lib/api";
import { showToast } from "@/lib/toast/store";
import { WORRY_CONTENT_MAX_LENGTH } from "@/lib/validation";

export default function WorryComposeScreen() {
  const { t } = useTranslation();
  const screenOptions = useMemo(
    () => ({ title: t("worry.compose.title") }),
    [t],
  );

  const queryClient = useQueryClient();
  const contentRef = useRef("");
  const [empty, setEmpty] = useState(true);
  const [category, setCategory] = useState<WorryCategory | null>(null);
  const { alertElement, show, showApiError } = useRetroAlert();

  useEffect(() => {
    show("info", t("worry.compose.notice"));
  }, [show, t]);

  const compose = useMutation({
    mutationFn: ({
      category: picked,
      content,
    }: {
      category: WorryCategory;
      content: string;
    }) => api.worries.create(picked, content),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: WORRIES_KEY });
      showToast("info", t("worry.compose.posted"));
      router.back();
    },
    onError: showApiError,
  });

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      <FormScreen
        footer={
          <RetroButton
            disabled={empty || !category || compose.isPending}
            onPress={() =>
              category &&
              compose.mutate({ category, content: contentRef.current.trim() })
            }
          >
            {compose.isPending ? (
              <Spinner color="white" />
            ) : (
              t("worry.compose.submit")
            )}
          </RetroButton>
        }
      >
        <YStack gap="$2">
          <Text theme="gray" color="$color11" fontSize="$3" fontWeight="600">
            {t("worry.compose.categoryLabel")}
          </Text>
          <WorryCategoryPicker value={category} onChange={setCategory} />
        </YStack>

        <CountedInput
          valueRef={contentRef}
          multiline
          rows={10}
          textAlignVertical="top"
          placeholder={t("common.contentPlaceholder")}
          maxLength={WORRY_CONTENT_MAX_LENGTH}
          onChangeText={(text) => setEmpty(text.trim().length === 0)}
        />
      </FormScreen>

      {alertElement}
    </SafeAreaView>
  );
}
