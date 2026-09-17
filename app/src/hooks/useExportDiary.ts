import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { AlertApi } from "@/hooks/useAlert";
import { isApiError } from "@/lib/api";
import { reportError } from "@/lib/crash";
import { exportDiaries } from "@/lib/diary-export";

const IDLE = { done: 0, total: 0 };

export function useExportDiary({ show, showApiError }: AlertApi) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(IDLE);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      exportDiaries((done, total) => setProgress({ done, total })),
    onSuccess: (result) => {
      if (result === "empty") {
        show("info", t("setting.exportDiaryEmpty"));
      }
    },
    onError: (error) => {
      // 내려받기, zip, 공유는 API 오류가 아니라서 남겨 두지 않으면 어디서 막혔는지 알 수 없다.
      if (!isApiError(error)) {
        reportError("diary-export", error);
      }

      showApiError(error);
    },
    onSettled: () => setProgress(IDLE),
  });

  return { exportDiary: mutate, exporting: isPending, progress };
}
