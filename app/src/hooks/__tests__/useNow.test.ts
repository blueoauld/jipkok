import { act, renderHook } from "@testing-library/react-native";

import { useNow } from "@/hooks/useNow";

beforeEach(() => jest.useFakeTimers({ now: Date.now() }));
afterEach(() => jest.useRealTimers());

async function tick() {
  await act(async () => {
    jest.advanceTimersByTime(60_000);
  });
}

describe("useNow", () => {
  it("1분마다 현재 시각을 갱신한다", async () => {
    const { result, unmount } = await renderHook(() => useNow());
    const first = result.current;

    await tick();

    expect(result.current).toBeGreaterThan(first);
    await unmount();
  });

  it("구독자가 없어지면 시각을 더 갱신하지 않는다", async () => {
    const first = await renderHook(() => useNow());
    await tick();
    const last = first.result.current;
    await first.unmount();

    await tick();
    const second = await renderHook(() => useNow());

    expect(second.result.current).toBe(last);
    await second.unmount();
  });
});
