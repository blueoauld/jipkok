import { useCallback, useState } from "react";

import { RetroAlert, type RetroAlertVariant } from "@/components/ui/RetroAlert";
import { apiErrorMessage } from "@/lib/alert";

type AlertState = {
  variant: RetroAlertVariant;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm?: () => void;
  onDismiss?: () => void;
};

const TITLES: Record<RetroAlertVariant, string> = {
  error: "에러",
  info: "알림",
  warning: "경고",
};

// 훅이 알림을 띄워야 할 때는 화면의 알림을 넘겨받는다. 화면마다 알림은 하나만 둔다.
export type RetroAlertApi = Pick<
  ReturnType<typeof useRetroAlert>,
  "show" | "showApiError" | "confirm"
>;

export function useRetroAlert(initial?: AlertState) {
  const [alert, setAlert] = useState<AlertState | null>(initial ?? null);

  const show = useCallback(
    (variant: RetroAlertVariant, message: string, onDismiss?: () => void) =>
      setAlert({ variant, message, onDismiss }),
    [],
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
      variant?: RetroAlertVariant;
    }) => setAlert({ variant: "warning", ...options }),
    [],
  );

  const alertElement = alert && (
    <RetroAlert
      visible
      variant={alert.variant}
      title={TITLES[alert.variant]}
      message={alert.message}
      confirmLabel={alert.confirmLabel}
      destructive={alert.destructive}
      onConfirm={alert.onConfirm}
      onClose={() => {
        setAlert(null);
        alert.onDismiss?.();
      }}
    />
  );

  return { alertElement, show, showApiError, confirm };
}
