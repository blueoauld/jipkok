import { useMutation } from "@tanstack/react-query";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { alertApiError } from "@/lib/alert";
import { api } from "@/lib/api";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { setBadgeCount, unregisterPushToken } from "@/lib/push/notifications";

const TITLE = "회원탈퇴";
const DESCRIPTION =
  "탈퇴하면 프로필과 주고받은 대화, 활동 내역이 모두 삭제되며 복구할 수 없습니다.";
const CONFIRM_LABEL = "탈퇴";

export function WithdrawDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const withdraw = useMutation({
    mutationFn: async () => {
      await unregisterPushToken().catch(() => undefined);
      setBadgeCount(0);
      await api.members.withdraw();
    },
    onError: alertApiError,
  });

  useLoadingOverlay(withdraw.isPending);

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={TITLE}
      description={DESCRIPTION}
      confirmLabel={CONFIRM_LABEL}
      destructive
      onConfirm={() => withdraw.mutate()}
    />
  );
}
