import { useMutation } from "@tanstack/react-query";

import type { AlertApi } from "@/hooks/useAlert";
import { api } from "@/lib/api";
import i18n from "@/lib/i18n";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { forgetDevice } from "@/lib/push/notifications";

const DESCRIPTION = i18n.t("hook.withdrawNotice");
const CONFIRM_LABEL = i18n.t("action.withdraw");

export function useWithdraw({ confirm, showApiError }: AlertApi) {
  const withdraw = useMutation({
    mutationFn: async () => {
      await api.members.withdraw();
      forgetDevice();
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
