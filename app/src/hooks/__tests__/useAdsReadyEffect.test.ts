import { act, renderHook } from "@testing-library/react-native";

import { useAdsReadyEffect } from "@/hooks/useAdsReadyEffect";

let mockReady: () => void = () => undefined;

jest.mock("@/lib/ads", () => ({
  whenAdsReady: () =>
    new Promise<void>((resolve) => {
      mockReady = resolve;
    }),
}));

describe("useAdsReadyEffect", () => {
  it("광고 준비가 끝난 뒤에 실행한다", async () => {
    const effect = jest.fn();

    const { unmount } = await renderHook(() => useAdsReadyEffect(effect));

    expect(effect).not.toHaveBeenCalled();

    await act(async () => mockReady());

    expect(effect).toHaveBeenCalledTimes(1);
    await unmount();
  });

  it("준비가 끝나기 전에 화면에서 빠지면 실행하지 않는다", async () => {
    const effect = jest.fn();

    const { unmount } = await renderHook(() => useAdsReadyEffect(effect));
    await unmount();
    await act(async () => mockReady());

    expect(effect).not.toHaveBeenCalled();
  });
});
