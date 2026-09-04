import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useNavigation } from "expo-router";
// expo-router가 usePreventRemove를 공개 export하지 않아 내장된 react-navigation에서 가져온다.
import { usePreventRemove } from "expo-router/build/react-navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, Text, YStack } from "tamagui";

import { FormScreen } from "@/components/FormScreen";
import { CountedInput } from "@/components/ui/CountedInput";
import { RetroButton } from "@/components/ui/RetroButton";
import { WorryCategoryPicker } from "@/components/worry/WorryCategoryChips";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { WORRY_LIST_KEY } from "@/hooks/useWorryPosts";
import { api, type WorryCategory } from "@/lib/api";
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
  const { alertElement, show, showApiError, confirm } = useRetroAlert();
  const navigation = useNavigation();

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

  // 1000자까지 쓰는 화면이라 쓰던 글이 있으면 뒤로 가기와 스와이프에 한 번 묻는다.
  // 등록 중에는 막지 않아야 성공 직후의 뒤로 가기가 통과한다.
  usePreventRemove(!empty && !compose.isPending, ({ data }) =>
    confirm({
      message: t("worry.compose.discardConfirm"),
      confirmLabel: t("action.discard"),
      destructive: true,
      onConfirm: () => navigation.dispatch(data.action),
    }),
  );

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
