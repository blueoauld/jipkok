import { ApiError, restoreSession } from "@/lib/api";
import { request } from "@/lib/api/client";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "@/lib/api/tokens";

jest.mock("@/lib/api/tokens", () => ({
  getAccessToken: jest.fn(),
  getRefreshToken: jest.fn(),
  saveTokens: jest.fn(),
  clearTokens: jest.fn(),
}));

const mockedTokens = {
  getAccessToken: jest.mocked(getAccessToken),
  getRefreshToken: jest.mocked(getRefreshToken),
  saveTokens: jest.mocked(saveTokens),
  clearTokens: jest.mocked(clearTokens),
};

function response(
  status: number,
  body?: unknown,
  headers?: Record<string, string>,
) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers,
  });
}

const fetchMock = jest.fn<Promise<Response>, [string, RequestInit]>();

beforeEach(() => {
  jest.clearAllMocks();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  mockedTokens.getAccessToken.mockReturnValue("access");
  mockedTokens.getRefreshToken.mockResolvedValue("refresh");
  mockedTokens.saveTokens.mockResolvedValue(undefined);
  mockedTokens.clearTokens.mockResolvedValue(undefined);
});

function calledPaths() {
  return fetchMock.mock.calls.map(([url]) => new URL(url).pathname);
}

describe("request", () => {
  it("본문이 있으면 JSON으로 풀고, 없으면 undefined를 준다", async () => {
    fetchMock.mockResolvedValueOnce(response(200, { ok: true }));
    fetchMock.mockResolvedValueOnce(response(204));

    await expect(request("/api/a")).resolves.toEqual({ ok: true });
    await expect(request("/api/b")).resolves.toBeUndefined();
  });

  it("쿼리는 undefined 값을 빼고 붙이고, 토큰과 앱 헤더를 싣는다", async () => {
    fetchMock.mockResolvedValueOnce(response(200));

    await request("/api/list", { query: { cursor: 3, unreadOnly: undefined } });

    const [url, init] = fetchMock.mock.calls[0];
    const headers = init.headers as Record<string, string>;

    expect(new URL(url).search).toBe("?cursor=3");
    expect(headers.Authorization).toBe("Bearer access");
    expect(headers["X-App-Version"]).toBeDefined();
    expect(headers["X-Platform"]).toBeDefined();
  });

  it("auth를 끄면 Authorization을 붙이지 않는다", async () => {
    fetchMock.mockResolvedValueOnce(response(200));

    await request("/api/auth/login", { auth: false, method: "POST", body: {} });

    const headers = fetchMock.mock.calls[0][1].headers as Record<
      string,
      string
    >;

    expect(headers.Authorization).toBeUndefined();
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("실패 응답의 code, message를 ApiError로 옮기고 없으면 폴백을 쓴다", async () => {
    fetchMock.mockResolvedValueOnce(
      response(404, {
        code: "CHAT_004",
        message: "채팅방을 찾을 수 없습니다.",
      }),
    );
    fetchMock.mockResolvedValueOnce(response(500, "not json"));

    await expect(request("/api/x")).rejects.toMatchObject({
      status: 404,
      code: "CHAT_004",
      message: "채팅방을 찾을 수 없습니다.",
    });
    await expect(request("/api/y")).rejects.toMatchObject({
      status: 500,
      code: "UNKNOWN",
    });
  });

  it("401이면 재발급하고 같은 요청을 다시 보낸다", async () => {
    fetchMock.mockResolvedValueOnce(response(401));
    fetchMock.mockResolvedValueOnce(
      response(200, { accessToken: "new", refreshToken: "new-refresh" }),
    );
    fetchMock.mockResolvedValueOnce(response(200, { ok: true }));

    await expect(request("/api/me")).resolves.toEqual({ ok: true });
    expect(calledPaths()).toEqual([
      "/api/me",
      "/api/auth/token/reissue",
      "/api/me",
    ]);
    expect(mockedTokens.saveTokens).toHaveBeenCalledWith({
      accessToken: "new",
      refreshToken: "new-refresh",
    });
  });

  it("동시에 여러 요청이 401을 받아도 재발급은 한 번만 한다", async () => {
    fetchMock.mockImplementation(async (url) => {
      const path = new URL(url).pathname;

      if (path === "/api/auth/token/reissue") {
        return response(200, { accessToken: "new", refreshToken: "r2" });
      }

      return response(
        mockedTokens.saveTokens.mock.calls.length > 0 ? 200 : 401,
        {},
      );
    });

    await Promise.all([
      request("/api/a"),
      request("/api/b"),
      request("/api/c"),
    ]);

    expect(
      calledPaths().filter((path) => path === "/api/auth/token/reissue"),
    ).toHaveLength(1);
  });

  it("재발급이 거절되면 토큰을 지우고 원래 오류를 던진다", async () => {
    fetchMock.mockResolvedValueOnce(response(401));
    fetchMock.mockResolvedValueOnce(
      response(401, { code: "AUTH_009", message: "다시" }),
    );

    await expect(request("/api/me")).rejects.toBeInstanceOf(ApiError);
    expect(mockedTokens.clearTokens).toHaveBeenCalled();
    expect(calledPaths()).toEqual(["/api/me", "/api/auth/token/reissue"]);
  });

  it("재발급 중 서버 장애면 토큰을 지우지 않는다", async () => {
    fetchMock.mockResolvedValueOnce(response(401));
    fetchMock.mockResolvedValueOnce(response(503));

    await expect(request("/api/me")).rejects.toMatchObject({ status: 503 });
    expect(mockedTokens.clearTokens).not.toHaveBeenCalled();
  });

  it("리프레시 토큰이 없으면 재발급을 시도하지 않는다", async () => {
    mockedTokens.getRefreshToken.mockResolvedValue(null);
    fetchMock.mockResolvedValueOnce(response(401));

    await expect(request("/api/me")).rejects.toMatchObject({ status: 401 });
    expect(mockedTokens.clearTokens).toHaveBeenCalled();
    expect(calledPaths()).toEqual(["/api/me"]);
  });

  it("auth를 끈 요청은 401이어도 재발급하지 않는다", async () => {
    fetchMock.mockResolvedValueOnce(
      response(401, { code: "AUTH_008", message: "x" }),
    );

    await expect(
      request("/api/auth/login", { auth: false }),
    ).rejects.toMatchObject({
      code: "AUTH_008",
    });
    expect(calledPaths()).toEqual(["/api/auth/login"]);
  });
});

describe("restoreSession", () => {
  it("재발급 성공 여부를 돌려준다", async () => {
    fetchMock.mockResolvedValueOnce(
      response(200, { accessToken: "a", refreshToken: "r" }),
    );

    await expect(restoreSession()).resolves.toBe(true);
  });
});
