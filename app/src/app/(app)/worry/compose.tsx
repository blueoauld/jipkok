import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { YStack } from "tamagui";

import { FormScreen } from "@/components/FormScreen";
import { Button } from "@/components/ui/Button";
import { CountedInput } from "@/components/ui/CountedInput";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { WorryCategoryPicker } from "@/components/worry/WorryCategoryChips";
import { useAlert } from "@/hooks/useAlert";
import { useConfirmLeave } from "@/hooks/useConfirmLeave";
import { WORRY_LIST_KEY } from "@/hooks/useWorryPosts";
import { api, type WorryCategory } from "@/lib/api";
import { CONTENT_INPUT_ROWS, FIELD_TEXT_GAP } from "@/lib/design";
import { showToast } from "@/lib/toast/store";
import { WORRY_CONTENT_MAX_LENGTH } from "@/lib/validation";

export default function WorryComposeScreen() {
  const { t } = useTranslation();
  // 네이티브 스택은 이탈 확인 중에 뒤로가기 메뉴로 여러 화면을 건너뛰면 상태가 어긋난다.
  const screenOptions = useMemo(
    () => ({
      title: t("worry.compose.title"),
      headerBackButtonMenuEnabled: false,
    }),
    [t],
  );

  const queryClient = useQueryClient();
  const contentRef = useRef("");
  const [empty, setEmpty] = useState(true);
  const [category, setCategory] = useState<WorryCategory | null>(null);
  const { alertElement, show, showApiError, confirm } = useAlert();

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
      await queryClient.invalidateQueries({ queryKey: WORRY_LIST_KEY });
      showToast("info", t("worry.compose.posted"));
      router.back();
    },
    onError: showApiError,
  });

  useConfirmLeave(!empty && !compose.isPending, confirm);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      <FormScreen
        footer={
          <Button
            size="xlarge"
            disabled={empty || !category}
            loading={compose.isPending}
            onPress={() =>
              category &&
              compose.mutate({ category, content: contentRef.current.trim() })
            }
          >
            {t("worry.compose.submit")}
          </Button>
        }
      >
        <YStack gap={FIELD_TEXT_GAP}>
          <FieldLabel>{t("worry.compose.categoryLabel")}</FieldLabel>
          <WorryCategoryPicker value={category} onChange={setCategory} />
        </YStack>

        <CountedInput
          valueRef={contentRef}
          multiline
          rows={CONTENT_INPUT_ROWS}
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
