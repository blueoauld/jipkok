import { isApiError } from "@/lib/api";
import i18n from "@/lib/i18n";

// 오류 코드는 실행 중에 정해져서 t의 키 타입을 태우지 못한다.
// 표를 직접 읽으면 없는 코드가 undefined로 돌아와 그대로 걸러진다.
function localized(code: string, serverMessage: string): string {
  const message: unknown = i18n.getResource(
    i18n.language,
    "translation",
    `error.${code}`,
  );

  return typeof message === "string" ? message : serverMessage;
}

export function apiErrorMessage(error: unknown, fallback?: string): string {
  if (isApiError(error)) {
    return localized(error.code, error.message);
  }

  return fallback ?? i18n.t("media.retryLater");
}
