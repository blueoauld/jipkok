import { act, renderHook } from "@testing-library/react-native";
import { NativeAd } from "react-native-google-mobile-ads";

import { useScreenNativeAd } from "@/hooks/useScreenNativeAd";

jest.mock("react-native-google-mobile-ads", () => ({
  NativeAd: { createForAdRequest: jest.fn() },
}));

let mockFocus: (() => void) | null = null;

jest.mock("expo-router", () => {
  const { useEffect } = jest.requireActual("react");

  return {
    useFocusEffect: (effect: () => void) => {
      mockFocus = effect;
      useEffect(() => effect(), [effect]);
    },
  };
});

const createAd = jest.mocked(NativeAd.createForAdRequest);

function fakeAd(video = false) {
  return {
    destroy: jest.fn(),
    mediaContent: { aspectRatio: 1, hasVideoContent: video, duration: 0 },
  } as unknown as NativeAd;
}

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function focusAt(time: number) {
  jest.spyOn(Date, "now").mockReturnValue(time);
  await act(async () => mockFocus?.());
  await flush();
}

function render(enabled: boolean) {
  return renderHook(
    (props: { enabled: boolean }) => useScreenNativeAd("unit", props.enabled),
    { initialProps: { enabled } },
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFocus = null;
  jest.spyOn(Date, "now").mockReturnValue(0);
});

describe("useScreenNativeAd", () => {
  it("채팅방이 있으면 광고를 받아 보여 준다", async () => {
    const ad = fakeAd();
    createAd.mockResolvedValue(ad);

    const { result, unmount } = await render(true);
    await flush();

    expect(createAd).toHaveBeenCalledWith("unit");
    expect(result.current).toBe(ad);
    await unmount();
  });

  it("채팅방이 없으면 받지 않다가 생기면 받는다", async () => {
    const ad = fakeAd();
    createAd.mockResolvedValue(ad);

    const { result, rerender, unmount } = await render(false);
    await flush();

    expect(createAd).not.toHaveBeenCalled();
    expect(result.current).toBeNull();

    await rerender({ enabled: true });
    await flush();

    expect(createAd).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(ad);
    await unmount();
  });

  it("다시 들어왔을 때 1분이 지났으면 새 광고로 바꾸고 이전 광고를 해제한다", async () => {
    const first = fakeAd();
    const second = fakeAd();
    createAd.mockResolvedValueOnce(first).mockResolvedValueOnce(second);

    const { result, unmount } = await render(true);
    await flush();

    await focusAt(30_000);

    expect(createAd).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(first);

    await focusAt(60_000);

    expect(createAd).toHaveBeenCalledTimes(2);
    expect(result.current).toBe(second);
    expect(first.destroy).toHaveBeenCalledTimes(1);
    expect(second.destroy).not.toHaveBeenCalled();
    await unmount();
  });

  it("새 광고를 못 받으면 보던 광고를 그대로 둔다", async () => {
    const ad = fakeAd();
    createAd
      .mockResolvedValueOnce(ad)
      .mockRejectedValueOnce(new Error("no fill"));

    const { result, unmount } = await render(true);
    await flush();
    await focusAt(60_000);

    expect(createAd).toHaveBeenCalledTimes(2);
    expect(result.current).toBe(ad);
    expect(ad.destroy).not.toHaveBeenCalled();
    await unmount();
  });

  it("동영상 광고는 보여 주지 않고 해제한다", async () => {
    const ad = fakeAd(true);
    createAd.mockResolvedValue(ad);

    const { result, unmount } = await render(true);
    await flush();

    expect(result.current).toBeNull();
    expect(ad.destroy).toHaveBeenCalledTimes(1);
    await unmount();
  });

  it("화면에서 빠지면 보던 광고와 늦게 온 광고를 모두 해제한다", async () => {
    const shown = fakeAd();
    const late = fakeAd();
    let resolveLate: (ad: NativeAd) => void = () => undefined;
    createAd.mockResolvedValueOnce(shown).mockReturnValueOnce(
      new Promise<NativeAd>((resolve) => {
        resolveLate = resolve;
      }),
    );

    const { unmount } = await render(true);
    await flush();
    await focusAt(60_000);
    await unmount();
    await act(async () => resolveLate(late));

    expect(shown.destroy).toHaveBeenCalledTimes(1);
    expect(late.destroy).toHaveBeenCalledTimes(1);
  });
});
