import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import { DotsThreeIcon } from "phosphor-react-native/src/icons/DotsThree";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { DiaryReader } from "@/components/diary/DiaryReader";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { MenuSheet } from "@/components/MenuSheet";
import { useAlert } from "@/hooks/useAlert";
import { DIARIES_KEY } from "@/hooks/useDiaries";
import { api, type DiaryResponse } from "@/lib/api";
import { formatFullDate, fromDateParam } from "@/lib/date";
import { moodEmoji } from "@/lib/diary";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { showToast } from "@/lib/toast/store";

export function DiaryReadScreen({
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
