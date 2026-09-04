import { rememberServerTime, serverNow } from "@/lib/api/server-clock";

const NOW = Date.parse("2026-09-04T00:43:00Z");

function response(date?: string) {
  return { headers: { get: () => date ?? null } } as unknown as Response;
}

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("serverNow", () => {
  it("응답의 Date 헤더만큼 기기 시계를 보정한다", () => {
    rememberServerTime(response("Fri, 04 Sep 2026 00:45:00 GMT"));

    expect(serverNow().toISOString()).toBe("2026-09-04T00:45:00.000Z");
  });

  it("헤더가 없거나 읽을 수 없으면 이전 보정을 유지한다", () => {
    rememberServerTime(response("Fri, 04 Sep 2026 00:45:00 GMT"));
    rememberServerTime(response());
    rememberServerTime(response("not a date"));

    expect(serverNow().toISOString()).toBe("2026-09-04T00:45:00.000Z");
  });
});
