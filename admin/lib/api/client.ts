const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const TOKEN_KEY = "accessToken";

export class ApiError extends Error {
  constructor(readonly status: number) {
    super(`API 요청이 실패했습니다. (${status})`);
  }
}

export async function api<T>(path: string): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);

  const response = await fetch(`${baseUrl}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) throw new ApiError(response.status);

  return response.json();
}
