import { APP_VERSION, DEVICE_PLATFORM } from "@/lib/device";
import i18n from "@/lib/i18n";

import { API_BASE_URL } from "./config";
import { ApiError } from "./errors";
import { rememberFailedRequestId } from "./request-id";
import { rememberServerTime } from "./server-clock";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "./tokens";

const REISSUE_PATH = "/api/auth/token/reissue";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  auth?: boolean;
};

let reissuing: Promise<boolean> | null = null;

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(path, API_BASE_URL);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

async function send(path: string, options: RequestOptions) {
  const headers: Record<string, string> = {
    "X-App-Version": APP_VERSION,
    "X-Platform": DEVICE_PLATFORM,
  };
  const token = getAccessToken();

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.auth !== false && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  rememberServerTime(response);

  return response;
}

async function toApiError(response: Response) {
  rememberFailedRequestId(response);

  const fallback = new ApiError(
    response.status,
    "UNKNOWN",
    i18n.t("common.requestFailed"),
  );

  try {
    const body = (await response.json()) as { code?: string; message?: string };

    if (!body.code || !body.message) {
      return fallback;
    }

    return new ApiError(response.status, body.code, body.message);
  } catch {
    return fallback;
  }
}

/**
 * 리프레시 토큰은 한 번 쓰면 회전하므로 동시에 여러 번 재발급하면 서버가 탈취로 보고 세션을 끊는다.
 * 진행 중인 재발급이 있으면 그 결과를 함께 기다린다.
 */
function reissue() {
  reissuing ??= runReissue().finally(() => {
    reissuing = null;
  });

  return reissuing;
}

async function runReissue() {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    await clearTokens();

    return false;
  }

  const response = await send(REISSUE_PATH, {
    method: "POST",
    body: { refreshToken },
    auth: false,
  });

  // 서버 장애는 세션이 끊긴 것이 아니므로 토큰을 지우지 않고 호출한 쪽에 실패를 알린다.
  if (response.status >= 500) {
    throw await toApiError(response);
  }

  if (!response.ok) {
    await clearTokens();

    return false;
  }

  await saveTokens(
    (await response.json()) as { accessToken: string; refreshToken: string },
  );

  return true;
}

export function restoreSession() {
  return reissue();
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  let response = await send(path, options);

  if (response.status === 401 && options.auth !== false && (await reissue())) {
    response = await send(path, options);
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  const body = await response.text();

  return (body ? JSON.parse(body) : undefined) as T;
}
