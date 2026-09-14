import { act, renderHook } from "@testing-library/react-native";

import { AD_RELOAD_DELAYS, isAdReady, useAdReload } from "@/hooks/useAdReload";
import { reportError } from "@/lib/crash";

jest.mock("@/lib/crash", () => ({ reportError: jest.fn() }));

const REPORT_NAME = "rewarded-ad";

const load = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("isAdReady", () => {
  it("불러왔고 실패가 없으면 준비된 것이다", () => {
    expect(isAdReady(true, undefined)).toBe(true);
  });

  it("불러왔더라도 실패가 있으면 준비된 것이 아니다", () => {
    expect(isAdReady(true, new Error("no fill"))).toBe(false);
  });

  it("아직 못 불러왔으면 준비된 것이 아니다", () => {
    expect(isAdReady(false, undefined)).toBe(false);
  });
});

describe("useAdReload", () => {
  it("실패하면 정해진 간격 뒤에 다시 불러온다", async () => {
    const { rerender } = await renderHook(
      ({ error }: { error?: Error }) => useAdReload(error, load, REPORT_NAME),
      { initialProps: { error: new Error("no fill") } },
    );

    await act(async () => {
      jest.advanceTimersByTime(AD_RELOAD_DELAYS[0] - 1);
    });
    expect(load).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(load).toHaveBeenCalledTimes(1);

    await rerender({ error: undefined });
    await rerender({ error: new Error("no fill") });
    await act(async () => {
      jest.advanceTimersByTime(AD_RELOAD_DELAYS[1]);
    });
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("횟수를 다 쓰면 포기하고, 새로 시작하면 횟수가 돌아온다", async () => {
    const { result, rerender } = await renderHook(
      ({ error }: { error?: Error }) => useAdReload(error, load, REPORT_NAME),
      { initialProps: { error: undefined as Error | undefined } },
    );

    for (const delay of AD_RELOAD_DELAYS) {
      await rerender({ error: new Error("no fill") });
      await act(async () => {
        jest.advanceTimersByTime(delay);
      });
      await rerender({ error: undefined });
    }

    await rerender({ error: new Error("no fill") });
    expect(result.current.givenUp).toBe(true);
    await act(async () => {
      jest.advanceTimersByTime(AD_RELOAD_DELAYS[2]);
    });
    expect(load).toHaveBeenCalledTimes(AD_RELOAD_DELAYS.length);

    await act(async () => result.current.reload());
    expect(load).toHaveBeenCalledTimes(AD_RELOAD_DELAYS.length + 1);
    await rerender({ error: undefined });
    await rerender({ error: new Error("no fill") });
    expect(result.current.givenUp).toBe(false);
  });

  it("실패할 때마다 사유를 한 번씩 남긴다", async () => {
    const first = new Error("no fill");
    const second = new Error("network error");
    const { rerender } = await renderHook(
      ({ error }: { error?: Error }) => useAdReload(error, load, REPORT_NAME),
      { initialProps: { error: undefined as Error | undefined } },
    );

    expect(reportError).not.toHaveBeenCalled();

    await rerender({ error: first });
    await rerender({ error: first });
    await rerender({ error: undefined });
    await rerender({ error: second });

    expect(reportError).toHaveBeenCalledTimes(2);
    expect(reportError).toHaveBeenNthCalledWith(1, REPORT_NAME, first);
    expect(reportError).toHaveBeenNthCalledWith(2, REPORT_NAME, second);
  });

  it("실패가 풀리면 예약한 재시도를 거둔다", async () => {
    const { rerender } = await renderHook(
      ({ error }: { error?: Error }) => useAdReload(error, load, REPORT_NAME),
      { initialProps: { error: new Error("no fill") } },
    );

    await rerender({ error: undefined });
    await act(async () => {
      jest.advanceTimersByTime(AD_RELOAD_DELAYS[0]);
    });
    expect(load).not.toHaveBeenCalled();
  });
});
