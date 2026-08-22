import { api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

type TokenResponse = components["schemas"]["TokenResponse"];

const KOREA_DIAL_CODE = "+82";

export const login = (phoneNumber: string, password: string) =>
  api<TokenResponse>("/api/auth/login", {
    method: "POST",
    body: { phoneNumber: KOREA_DIAL_CODE + phoneNumber.slice(1), password },
    auth: false,
  });

export const logout = (refreshToken: string) =>
  api<void>("/api/auth/logout", {
    method: "POST",
    body: { refreshToken },
    auth: false,
  });
