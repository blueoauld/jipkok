import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "@/lib/auth";
import type { Tokens } from "@/lib/auth";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const REISSUE_PATH = "/api/auth/token/reissue";
const LOGIN_PAGE = "/login";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message?: string,
  ) {
    super(message ?? `API 요청이 실패했습니다. (${status})`);
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  auth?: boolean;
};

let reissuing: Promise<boolean> | null = null;

async function send(path: string, options: RequestOptions) {
  const headers: Record<string, string> = {};
  const token = getAccessToken();

  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.auth !== false && token)
    headers.Authorization = `Bearer ${token}`;

  const url = new URL(`${baseUrl}${path}`);
  Object.entries(options.query ?? {}).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value));
  });

  return fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

async function reissue(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const response = await fetch(`${baseUrl}${REISSUE_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) return false;

  saveTokens((await response.json()) as Tokens);
  return true;
}

function reissueOnce() {
  reissuing ??= reissue().finally(() => {
    reissuing = null;
  });
  return reissuing;
}

async function toError(response: Response) {
  const body = await response.json().catch(() => null);
  const message =
    body && typeof body.message === "string" ? body.message : undefined;
  return new ApiError(response.status, message);
}

export async function api<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  let response = await send(path, options);

  if (response.status === 401 && options.auth !== false) {
    if (await reissueOnce()) {
      response = await send(path, options);
    } else {
      clearTokens();
      window.location.assign(LOGIN_PAGE);
      throw new ApiError(401);
    }
  }

  if (!response.ok) throw await toError(response);

  if (response.status === 204) return undefined as T;

  return response.json();
}
