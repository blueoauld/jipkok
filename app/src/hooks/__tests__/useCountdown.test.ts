import { act, renderHook } from "@testing-library/react-native";

import { useCountdown } from "@/hooks/useCountdown";

describe("useCountdown", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("시작하면 초 단위로 줄다가 0에서 멈춘다", async () => {
    const { result } = await renderHook(() => useCountdown());

    expect(result.current.remaining).toBe(0);

    await act(() => result.current.start(3));
    expect(result.current.remaining).toBe(3);

    await act(() => jest.advanceTimersByTime(1000));
    expect(result.current.remaining).toBe(2);

    await act(() => jest.advanceTimersByTime(3000));
    expect(result.current.remaining).toBe(0);
  });
});
