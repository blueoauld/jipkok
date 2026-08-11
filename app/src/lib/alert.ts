import { Alert } from "react-native";

import { isApiError } from "@/lib/api";

const TITLE = "오류";
const INFO_TITLE = "알림";
const FALLBACK_MESSAGE = "잠시 후 다시 시도해주시길 바랍니다.";

export function apiErrorMessage(error: unknown) {
  return isApiError(error) ? error.message : FALLBACK_MESSAGE;
}

export function alertApiError(error: unknown) {
  Alert.alert(TITLE, apiErrorMessage(error));
}

export function alertMessage(message: string) {
  Alert.alert(TITLE, message);
}

export function alertInfo(message: string) {
  Alert.alert(INFO_TITLE, message);
}

export function confirmAlert({
  title,
  message,
  confirmLabel,
  destructive,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  Alert.alert(title, message, [
    { text: "닫기", style: "cancel" },
    {
      text: confirmLabel,
      style: destructive ? "destructive" : "default",
      onPress: onConfirm,
    },
  ]);
}
