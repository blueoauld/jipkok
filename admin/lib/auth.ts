const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function saveTokens(tokens: Tokens) {
  localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function roleOf(accessToken: string): string | null {
  try {
    const payload = accessToken.split(".")[1];
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    return typeof decoded.role === "string" ? decoded.role : null;
  } catch {
    return null;
  }
}
