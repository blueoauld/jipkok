import { useCallback, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { apiErrorMessage } from "@/lib/alert";
import i18n from "@/lib/i18n";

type AlertVariant = "error" | "info" | "warning";

type AlertState = {
  variant: AlertVariant;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm?: () => void;
  onDismiss?: () => void;
};

const TITLES: Record<AlertVariant, string> = {
  error: i18n.t("alert.error"),
  info: i18n.t("alert.info"),
  warning: i18n.t("alert.warning"),
};

// 훅이 알림을 띄워야 할 때는 화면의 알림을 넘겨받는다. 화면마다 알림은 하나만 둔다.
export type AlertApi = Pick<
  ReturnType<typeof useAlert>,
  "show" | "showApiError" | "confirm"
>;

export function useAlert(initial?: AlertState) {
  const [alert, setAlert] = useState<AlertState | null>(initial ?? null);
  // 닫힌 뒤에도 마지막 알림을 남겨 두어야 나가는 전환을 그릴 수 있다.
  const [open, setOpen] = useState(initial != null);

  const present = useCallback((next: AlertState) => {
    setAlert(next);
    setOpen(true);
  }, []);

  const show = useCallback(
    (variant: AlertVariant, message: string, onDismiss?: () => void) =>
      present({ variant, message, onDismiss }),
    [present],
  );

  const showApiError = useCallback(
    (error: unknown) => show("error", apiErrorMessage(error)),
    [show],
  );

  const confirm = useCallback(
    (options: {
      message: string;
      confirmLabel: string;
      destructive?: boolean;
      onConfirm: () => void;
      variant?: AlertVariant;
    }) => present({ variant: "warning", ...options }),
    [present],
  );

  const alertElement = alert && (
    <Alert
      visible={open}
      title={TITLES[alert.variant]}
      message={alert.message}
      confirmLabel={alert.confirmLabel}
      destructive={alert.destructive}
      onConfirm={alert.onConfirm}
      onClose={() => {
        setOpen(false);
        alert.onDismiss?.();
      }}
    />
  );

  return { alertElement, show, showApiError, confirm };
}
