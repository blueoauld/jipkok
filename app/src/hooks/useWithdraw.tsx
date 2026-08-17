import { useMutation } from "@tanstack/react-query";

import type { RetroAlertApi } from "@/hooks/useRetroAlert";
import { api } from "@/lib/api";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { releaseDevice } from "@/lib/push/notifications";

const DESCRIPTION =
  "탈퇴하면 프로필과 주고받은 대화, 활동 내역이 모두 삭제되며 복구할 수 없습니다.";
const CONFIRM_LABEL = "탈퇴";

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
