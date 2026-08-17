import { isApiError } from "@/lib/api";

const FALLBACK_MESSAGE = "잠시 후 다시 시도해주시길 바랍니다.";

export function apiErrorMessage(error: unknown, fallback = FALLBACK_MESSAGE) {
  return isApiError(error) ? error.message : fallback;
}
