import { ApiError } from "./errors";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "./tokens";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const REISSUE_PATH = "/api/auth/token/reissue";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  auth?: boolean;
};

let reissuing: Promise<boolean> | null = null;

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(path, BASE_URL);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

async function send(path: string, options: RequestOptions) {
  const headers: Record<string, string> = {};
  const token = getAccessToken();

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.auth !== false && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

async function toApiError(response: Response) {
  const fallback = new ApiError(
    response.status,
    "UNKNOWN",
    "요청을 처리하지 못했습니다.",
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
    return false;
  }

  const response = await send(REISSUE_PATH, {
    method: "POST",
    body: { refreshToken },
    auth: false,
  });

  if (!response.ok) {
    await clearTokens();

    return false;
  }

  await saveTokens(
    (await response.json()) as { accessToken: string; refreshToken: string },
  );

  return true;
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

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
