import { api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

type TokenResponse = components["schemas"]["TokenResponse"];

export const login = (phoneNumber: string, password: string) =>
  api<TokenResponse>("/api/auth/login", {
    method: "POST",
    body: { phoneNumber, password },
    auth: false,
  });

export const logout = (refreshToken: string) =>
  api<void>("/api/auth/logout", {
    method: "POST",
    body: { refreshToken },
    auth: false,
  });
