import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  router,
  Stack,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";
// expo-router가 usePreventRemove를 공개 export하지 않아 내장된 react-navigation에서 가져온다.
import { usePreventRemove } from "expo-router/build/react-navigation";
import { DotsThreeIcon } from "phosphor-react-native/src/icons/DotsThree";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import { DiaryAttachmentStrip } from "@/components/diary/DiaryAttachmentStrip";
import { DiaryMoodPicker } from "@/components/diary/DiaryMoodPicker";
import { DiaryReader } from "@/components/diary/DiaryReader";
import { FormScreen } from "@/components/FormScreen";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { MenuSheet } from "@/components/MenuSheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ScreenState } from "@/components/ui/ScreenState";
import { useAlert } from "@/hooks/useAlert";
import { DIARIES_KEY, useDiaryMonth } from "@/hooks/useDiaries";
import { useDiaryAttachments } from "@/hooks/useDiaryAttachments";
import { useDiaryAttachmentViewer } from "@/hooks/useDiaryAttachmentViewer";
import { api, type DiaryMood, type DiaryResponse } from "@/lib/api";
import { formatFullDate, fromDateParam, toMonthParam } from "@/lib/date";
import { CONTENT_INPUT_ROWS } from "@/lib/design";
import { moodEmoji } from "@/lib/diary";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { showToast } from "@/lib/toast/store";
import { describeUploadError } from "@/lib/upload";
import {
  DIARY_ATTACHMENTS_MAX,
  DIARY_CONTENT_MAX_LENGTH,
} from "@/lib/validation";

function DiaryEditor({
  entryDate,
  diary,
  onSaved,
}: {
  entryDate: string;
  diary?: DiaryResponse;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const { alertElement, showApiError, confirm } = useAlert();
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
  const viewer = useDiaryAttachmentViewer(attachments.items);

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
      onSaved();
    },
    onError: showApiError,
  });

  useLoadingOverlay(
    attachments.progress.total > 0,
    attachments.progress.done,
    attachments.progress.total,
  );

  const pending = write.isPending;

  // 네이티브 스택은 이탈 확인 중에 뒤로가기 메뉴로 여러 화면을 건너뛰면 상태가 어긋난다.
  const screenOptions = useMemo(
    () => ({
      title: formatFullDate(fromDateParam(entryDate)),
      headerBackButtonMenuEnabled: false,
      headerRight: undefined,
    }),
    [entryDate],
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

  return (
    <>
      <Stack.Screen options={screenOptions} />

      <FormScreen
        footer={
          <Button
            size="xlarge"
            disabled={empty || !dirty}
            loading={pending}
            onPress={() => write.mutate()}
          >
            {t("action.save")}
          </Button>
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
          onPress={viewer.open}
        />

        <Input
          multiline
          rows={CONTENT_INPUT_ROWS}
          textAlignVertical="top"
          placeholder={t("diary.placeholder")}
          maxLength={DIARY_CONTENT_MAX_LENGTH}
          defaultValue={initial}
          onChangeText={(text) => {
            contentRef.current = text;
            setTextEmpty(text.trim().length === 0);
            setTextDirty(text !== initial);
          }}
        />
      </FormScreen>

      {viewer.element}

      {alertElement}
    </>
  );
}

function DiaryReadScreen({
  entryDate,
  diary,
  onEdit,
}: {
  entryDate: string;
  diary: DiaryResponse;
  onEdit: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { alertElement, showApiError, confirm } = useAlert();
  const [menuOpen, setMenuOpen] = useState(false);

  const remove = useMutation({
    mutationFn: () => api.diaries.remove(entryDate),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: DIARIES_KEY });
      showToast("info", t("diary.deleted"));
      router.back();
    },
    onError: showApiError,
  });

  useLoadingOverlay(remove.isPending);

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

  const openMenu = useCallback(() => setMenuOpen(true), []);
  const emoji = moodEmoji(diary.mood);
  const screenOptions = useMemo(
    () => ({
      title: `${emoji ? `${emoji} ` : ""}${formatFullDate(fromDateParam(entryDate))}`,
      headerRight: () => (
        <HeaderIconButton
          icon={DotsThreeIcon}
          label={t("a11y.more")}
          weight="bold"
          onPress={openMenu}
        />
      ),
    }),
    [emoji, entryDate, openMenu, t],
  );

  return (
    <>
      <Stack.Screen options={screenOptions} />

      <DiaryReader diary={diary} />

      <MenuSheet
        open={menuOpen}
        onOpenChange={setMenuOpen}
        items={[
          { label: t("action.edit"), onPress: onEdit },
          {
            label: t("action.delete"),
            destructive: true,
            onPress: confirmRemove,
          },
        ]}
      />

      {alertElement}
    </>
  );
}

// 일기가 있는 날은 읽기로 열고, 없는 날은 바로 쓴다. 저장하면 읽기로 돌아온다.
function DiaryEntry({
  entryDate,
  diary,
}: {
  entryDate: string;
  diary?: DiaryResponse;
}) {
  const [editing, setEditing] = useState(diary == null);
  const finishEditing = useCallback(() => setEditing(false), []);
  const startEditing = useCallback(() => setEditing(true), []);

  if (editing || !diary) {
    return (
      <DiaryEditor
        entryDate={entryDate}
        diary={diary}
        onSaved={finishEditing}
      />
    );
  }

  return (
    <DiaryReadScreen
      entryDate={entryDate}
      diary={diary}
      onEdit={startEditing}
    />
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
        <DiaryEntry entryDate={date} diary={diary} />
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
