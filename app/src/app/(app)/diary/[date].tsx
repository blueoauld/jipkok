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

import { VideoPlayerModal } from "@/components/chat/VideoPlayerModal";
import { DiaryAttachmentStrip } from "@/components/diary/DiaryAttachmentStrip";
import { DiaryMoodPicker } from "@/components/diary/DiaryMoodPicker";
import { FormScreen } from "@/components/FormScreen";
import { HeaderSoloIconButton } from "@/components/HeaderSoloIconButton";
import { PhotoViewer } from "@/components/photo/PhotoViewer";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroInput } from "@/components/ui/RetroInput";
import { ScreenState } from "@/components/ui/ScreenState";
import { DIARIES_KEY, useDiaryMonth } from "@/hooks/useDiaries";
import {
  draftMediaUri,
  isDraftVideo,
  useDiaryAttachments,
} from "@/hooks/useDiaryAttachments";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { api, type DiaryMood, type DiaryResponse } from "@/lib/api";
import { formatFullDate, fromDateParam, toMonthParam } from "@/lib/date";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { showToast } from "@/lib/toast/store";
import { describeUploadError } from "@/lib/upload";
import { DIARY_ATTACHMENTS_MAX } from "@/lib/validation";

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
  const [textEmpty, setTextEmpty] = useState(initial.trim().length === 0);
  const [textDirty, setTextDirty] = useState(false);
  const attachments = useDiaryAttachments(
    diary?.attachments ?? [],
    showApiError,
  );
  const initialMood = diary?.mood ?? null;
  const [mood, setMood] = useState<DiaryMood | null>(initialMood);
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const empty = textEmpty && attachments.items.length === 0;
  const dirty = textDirty || attachments.dirty || mood !== initialMood;

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: DIARIES_KEY }),
    [queryClient],
  );

  const { upload } = attachments;
  const write = useMutation({
    mutationFn: async () => {
      let uploaded;

      try {
        uploaded = await upload();
      } catch (error) {
        throw describeUploadError(error);
      }

      await api.diaries.write(entryDate, {
        content: contentRef.current.trim() || null,
        mood,
        attachments: uploaded,
      });
    },
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

  useLoadingOverlay(
    remove.isPending || attachments.progress.total > 0,
    attachments.progress.done,
    attachments.progress.total,
  );

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
      message: t("common.leaveUnsaved"),
      confirmLabel: t("action.leave"),
      destructive: true,
      onConfirm: () => navigation.dispatch(data.action),
    }),
  );

  const photoUris = useMemo(
    () =>
      attachments.items
        .filter((item) => !isDraftVideo(item))
        .map(draftMediaUri),
    [attachments.items],
  );

  const openAttachment = useCallback(
    (index: number) => {
      const item = attachments.items[index];

      if (isDraftVideo(item)) {
        setVideoUrl(draftMediaUri(item));
        return;
      }

      setPhotoIndex(photoUris.indexOf(draftMediaUri(item)));
    },
    [attachments.items, photoUris],
  );

  return (
    <>
      <Stack.Screen options={screenOptions} />

      <FormScreen
        footer={
          <RetroButton
            disabled={empty || !dirty || pending}
            onPress={() => write.mutate()}
          >
            {write.isPending ? <Spinner color="$color11" /> : t("action.save")}
          </RetroButton>
        }
      >
        <DiaryMoodPicker value={mood} onChange={setMood} />

        <DiaryAttachmentStrip
          items={attachments.items}
          onAdd={
            attachments.items.length < DIARY_ATTACHMENTS_MAX
              ? attachments.add
              : undefined
          }
          onRemove={attachments.remove}
          onMove={attachments.move}
          onPress={openAttachment}
        />

        <RetroInput
          multiline
          rows={ROWS}
          textAlignVertical="top"
          placeholder={t("diary.placeholder")}
          defaultValue={initial}
          onChangeText={(text) => {
            contentRef.current = text;
            setTextEmpty(text.trim().length === 0);
            setTextDirty(text !== initial);
          }}
        />
      </FormScreen>

      <PhotoViewer
        photos={photoUris}
        initialIndex={photoIndex ?? 0}
        open={photoIndex !== null}
        onClose={() => setPhotoIndex(null)}
      />

      <VideoPlayerModal url={videoUrl} onClose={() => setVideoUrl(null)} />

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
