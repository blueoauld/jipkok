import * as SecureStore from "expo-secure-store";

import { useAuthStore } from "@/lib/auth/store";

const REFRESH_TOKEN_KEY = "jipkok.refreshToken";

let accessToken: string | null = null;

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function saveTokens(tokens: {
  accessToken: string;
  refreshToken: string;
}) {
  accessToken = tokens.accessToken;
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
  useAuthStore.getState().signin();
}

export async function clearTokens() {
  accessToken = null;
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  useAuthStore.getState().signout();
}
