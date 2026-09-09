import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  router,
  Stack,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";
// expo-router가 usePreventRemove를 공개 export하지 않아 내장된 react-navigation에서 가져온다.
import { usePreventRemove } from "expo-router/build/react-navigation";
import { TrashIcon } from "phosphor-react-native/src/icons/Trash";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner } from "tamagui";

import { FormScreen } from "@/components/FormScreen";
import { HeaderSoloIconButton } from "@/components/HeaderSoloIconButton";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroInput } from "@/components/ui/RetroInput";
import { ScreenState } from "@/components/ui/ScreenState";
import { DIARIES_KEY, useDiaryMonth } from "@/hooks/useDiaries";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { api, type DiaryResponse } from "@/lib/api";
import { formatFullDate, fromDateParam, toMonthParam } from "@/lib/date";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { showToast } from "@/lib/toast/store";

const ROWS = 14;

function DiaryEditor({
  entryDate,
  diary,
}: {
  entryDate: string;
  diary?: DiaryResponse;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const { alertElement, showApiError, confirm } = useRetroAlert();
  const initial = diary?.content ?? "";
  const contentRef = useRef(initial);
  const [empty, setEmpty] = useState(initial.trim().length === 0);
  const [dirty, setDirty] = useState(false);

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: DIARIES_KEY }),
    [queryClient],
  );

  const write = useMutation({
    mutationFn: (content: string) => api.diaries.write(entryDate, content),
    onSuccess: async () => {
      await invalidate();
      showToast("info", t("diary.saved"));
      router.back();
    },
    onError: showApiError,
  });

  const remove = useMutation({
    mutationFn: () => api.diaries.remove(entryDate),
    onSuccess: async () => {
      await invalidate();
      showToast("info", t("diary.deleted"));
      router.back();
    },
    onError: showApiError,
  });

  useLoadingOverlay(remove.isPending);

  const pending = write.isPending || remove.isPending;
  const { mutate: removeMutate } = remove;
  const confirmRemove = useCallback(
    () =>
      confirm({
        message: t("diary.deleteConfirm"),
        confirmLabel: t("action.delete"),
        destructive: true,
        onConfirm: () => removeMutate(),
      }),
    [confirm, removeMutate, t],
  );

  // 네이티브 스택은 이탈 확인 중에 뒤로가기 메뉴로 여러 화면을 건너뛰면 상태가 어긋난다.
  const screenOptions = useMemo(
    () => ({
      title: formatFullDate(fromDateParam(entryDate)),
      headerBackButtonMenuEnabled: false,
      headerRight: diary
        ? () => (
            <HeaderSoloIconButton
              icon={TrashIcon}
              label={t("action.delete")}
              onPress={confirmRemove}
            />
          )
        : undefined,
    }),
    [confirmRemove, diary, entryDate, t],
  );

  // 저장 중에는 막지 않아야 성공 직후의 뒤로 가기가 통과한다.
  usePreventRemove(dirty && !pending, ({ data }) =>
    confirm({
      message: t("diary.discardConfirm"),
      confirmLabel: t("action.discard"),
      destructive: true,
      onConfirm: () => navigation.dispatch(data.action),
    }),
  );

  return (
    <>
      <Stack.Screen options={screenOptions} />

      <FormScreen
        footer={
          <RetroButton
            disabled={empty || !dirty || pending}
            onPress={() => write.mutate(contentRef.current.trim())}
          >
            {write.isPending ? <Spinner color="$color11" /> : t("action.save")}
          </RetroButton>
        }
      >
        <RetroInput
          multiline
          rows={ROWS}
          textAlignVertical="top"
          placeholder={t("diary.placeholder")}
          defaultValue={initial}
          onChangeText={(text) => {
            contentRef.current = text;
            setEmpty(text.trim().length === 0);
            setDirty(text !== initial);
          }}
        />
      </FormScreen>

      {alertElement}
    </>
  );
}

export default function DiaryEntryScreen() {
  const { t } = useTranslation();
  const { date } = useLocalSearchParams<{ date: string }>();
  const { data: diaries, error, refetch } = useDiaryMonth(toMonthParam(date));
  const diary = diaries?.find((item) => item.entryDate === date);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      {diaries ? (
        <DiaryEditor entryDate={date} diary={diary} />
      ) : (
        <>
          <Stack.Screen
            options={{ title: formatFullDate(fromDateParam(date)) }}
          />
          <ScreenState
            error={error}
            message={t("diary.loadFailed")}
            onRetry={() => refetch()}
          />
        </>
      )}
    </SafeAreaView>
  );
}
