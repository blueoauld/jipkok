import { useMutation } from "@tanstack/react-query";

import type { RetroAlertApi } from "@/hooks/useRetroAlert";
import { api } from "@/lib/api";
import i18n from "@/lib/i18n";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { releaseDevice } from "@/lib/push/notifications";

const DESCRIPTION = i18n.t("hook.withdrawNotice");
const CONFIRM_LABEL = i18n.t("action.withdraw");

export function useWithdraw({ confirm, showApiError }: RetroAlertApi) {
  const withdraw = useMutation({
    mutationFn: async () => {
      await releaseDevice();
      await api.members.withdraw();
    },
    onError: showApiError,
  });

  useLoadingOverlay(withdraw.isPending);

  const confirmWithdraw = () =>
    confirm({
      message: DESCRIPTION,
      confirmLabel: CONFIRM_LABEL,
      destructive: true,
      onConfirm: () => withdraw.mutate(),
    });

  return { confirmWithdraw };
}
