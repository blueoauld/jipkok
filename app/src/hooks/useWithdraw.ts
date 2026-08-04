import { useMutation } from "@tanstack/react-query";

import { alertApiError, confirmAlert } from "@/lib/alert";
import { api } from "@/lib/api";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { setBadgeCount, unregisterPushToken } from "@/lib/push/notifications";

const TITLE = "회원탈퇴";
const DESCRIPTION =
  "탈퇴하면 프로필과 주고받은 대화, 활동 내역이 모두 삭제되며 복구할 수 없습니다.";
const CONFIRM_LABEL = "탈퇴";

export function useWithdraw() {
  const withdraw = useMutation({
    mutationFn: async () => {
      await unregisterPushToken().catch(() => undefined);
      setBadgeCount(0);
      await api.members.withdraw();
    },
    onError: alertApiError,
  });

  useLoadingOverlay(withdraw.isPending);

  return () =>
    confirmAlert({
      title: TITLE,
      message: DESCRIPTION,
      confirmLabel: CONFIRM_LABEL,
      destructive: true,
      onConfirm: () => withdraw.mutate(),
    });
}
