import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { DiaryAttachmentStrip } from "@/components/diary/DiaryAttachmentStrip";
import { DiaryMoodPicker } from "@/components/diary/DiaryMoodPicker";
import { FormScreen } from "@/components/FormScreen";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAlert } from "@/hooks/useAlert";
import { useConfirmLeave } from "@/hooks/useConfirmLeave";
import { DIARIES_KEY } from "@/hooks/useDiaries";
import { useDiaryAttachments } from "@/hooks/useDiaryAttachments";
import { useDiaryAttachmentViewer } from "@/hooks/useDiaryAttachmentViewer";
import { api, type DiaryMood, type DiaryResponse } from "@/lib/api";
import { formatFullDate, fromDateParam } from "@/lib/date";
import { CONTENT_INPUT_ROWS } from "@/lib/design";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { showToast } from "@/lib/toast/store";
import { describeUploadError } from "@/lib/upload";
import {
  DIARY_ATTACHMENTS_MAX,
  DIARY_CONTENT_MAX_LENGTH,
} from "@/lib/validation";

export function DiaryEditor({
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

  useConfirmLeave(dirty && !pending, confirm);

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
