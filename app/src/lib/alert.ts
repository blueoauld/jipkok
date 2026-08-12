import { Alert } from "react-native";

import { isApiError } from "@/lib/api";

const TITLE = "오류";
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
