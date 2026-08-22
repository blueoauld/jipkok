import { isApiError } from "@/lib/api";
import i18n from "@/lib/i18n";

const FALLBACK_MESSAGE = i18n.t("media.retryLater");

export function apiErrorMessage(error: unknown, fallback = FALLBACK_MESSAGE) {
  return isApiError(error) ? error.message : fallback;
}
