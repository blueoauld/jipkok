import * as SecureStore from "expo-secure-store";

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "@/lib/api/tokens";
import { useAuthStore } from "@/lib/auth/store";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const secureStore = jest.mocked(SecureStore);

beforeEach(() => {
  secureStore.getItemAsync.mockResolvedValue(null);
  secureStore.setItemAsync.mockResolvedValue(undefined);
  secureStore.deleteItemAsync.mockResolvedValue(undefined);
  useAuthStore.setState({ status: "unknown" });
});

describe("tokens", () => {
  it("저장하면 access는 메모리에, refresh는 보안 저장소에 두고 로그인 상태가 된다", async () => {
    await saveTokens({ accessToken: "access", refreshToken: "refresh" });

    expect(getAccessToken()).toBe("access");
    expect(secureStore.setItemAsync).toHaveBeenCalledWith(
      "jipkok.refreshToken",
      "refresh",
    );
    expect(useAuthStore.getState().status).toBe("authenticated");
  });

  it("refresh 토큰은 보안 저장소에서 읽는다", async () => {
    secureStore.getItemAsync.mockResolvedValue("stored");

    await expect(getRefreshToken()).resolves.toBe("stored");
    expect(secureStore.getItemAsync).toHaveBeenCalledWith(
      "jipkok.refreshToken",
    );
  });

  it("지우면 둘 다 비우고 로그아웃 상태가 된다", async () => {
    await saveTokens({ accessToken: "access", refreshToken: "refresh" });

    await clearTokens();

    expect(getAccessToken()).toBeNull();
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith(
      "jipkok.refreshToken",
    );
    expect(useAuthStore.getState().status).toBe("unauthenticated");
  });
});
