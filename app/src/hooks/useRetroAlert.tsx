import { useState } from "react";

import { RetroAlert, type RetroAlertVariant } from "@/components/ui/RetroAlert";
import { apiErrorMessage } from "@/lib/alert";

type AlertState = {
  variant: RetroAlertVariant;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm?: () => void;
};

const TITLES: Record<RetroAlertVariant, string> = {
  error: "에러",
  info: "알림",
  warning: "경고",
};

export function useRetroAlert(initial?: AlertState) {
  const [alert, setAlert] = useState<AlertState | null>(initial ?? null);

  const show = (variant: RetroAlertVariant, message: string) =>
    setAlert({ variant, message });

  const showApiError = (error: unknown) =>
    show("error", apiErrorMessage(error));

  const confirm = (options: {
    message: string;
    confirmLabel: string;
    destructive?: boolean;
    onConfirm: () => void;
    variant?: RetroAlertVariant;
  }) => setAlert({ variant: "warning", ...options });

  const alertElement = (
    <RetroAlert
      visible={alert !== null}
      variant={alert?.variant}
      title={alert ? TITLES[alert.variant] : ""}
      message={alert?.message ?? ""}
      confirmLabel={alert?.confirmLabel}
      destructive={alert?.destructive}
      onConfirm={alert?.onConfirm}
      onClose={() => setAlert(null)}
    />
  );

  return { alertElement, show, showApiError, confirm };
}
