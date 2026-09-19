import { act, renderHook } from "@testing-library/react-native";
import {
  NativeAd,
  type NativeMediaAspectRatio,
} from "react-native-google-mobile-ads";

import { useListNativeAds } from "@/hooks/useListNativeAds";

jest.mock("react-native-google-mobile-ads", () => ({
  NativeAd: { createForAdRequest: jest.fn() },
}));

const mockReady = jest.fn(() => Promise.resolve());

jest.mock("@/lib/ads", () => ({
  NATIVE_AD_UNIT_ID: "unit",
  LIST_AD_INTERVAL: 5,
  whenAdsReady: () => mockReady(),
}));

const createAd = jest.mocked(NativeAd.createForAdRequest);

const LANDSCAPE = 2 as NativeMediaAspectRatio;

function fakeAd(hasVideoContent = false) {
  return {
    destroy: jest.fn(),
    mediaContent: { hasVideoContent },
  } as unknown as NativeAd;
}

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function render(
  count: number,
  listKey = "a",
  options: Parameters<typeof useListNativeAds>[0] = { aspectRatio: LANDSCAPE },
) {
  return renderHook(
    (props: { count: number; listKey: string }) =>
      useListNativeAds(options, props.count, props.listKey),
    { initialProps: { count, listKey } },
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useListNativeAds", () => {
  it("카드 5장마다 광고를 하나씩 받는다", async () => {
    createAd.mockImplementation(async () => fakeAd());

    const { result, unmount } = await render(12);
    await flush();

    expect(createAd).toHaveBeenCalledTimes(2);
    expect(createAd).toHaveBeenCalledWith("unit", { aspectRatio: LANDSCAPE });
    expect(result.current).toHaveLength(2);
    await unmount();
  });

  it("광고 단위와 간격을 주면 그 단위로 간격마다 받는다", async () => {
    createAd.mockImplementation(async () => fakeAd());

    const { result, unmount } = await render(25, "a", {
      unitId: "member-unit",
      interval: 10,
    });
    await flush();

    expect(createAd).toHaveBeenCalledTimes(2);
    expect(createAd).toHaveBeenCalledWith("member-unit", {
      aspectRatio: undefined,
    });
    expect(result.current).toHaveLength(2);
    await unmount();
  });

  it("이미지만 받는 목록이면 동영상 광고는 해제하고 항목이 더 늘 때까지 다시 요청하지 않는다", async () => {
    const video = fakeAd(true);
    createAd
      .mockResolvedValueOnce(video)
      .mockImplementation(async () => fakeAd());

    const { result, rerender, unmount } = await render(10, "a", {
      interval: 10,
      imageOnly: true,
    });
    await flush();

    expect(video.destroy).toHaveBeenCalledTimes(1);
    expect(createAd).toHaveBeenCalledTimes(1);
    expect(result.current).toHaveLength(0);

    await rerender({ count: 20, listKey: "a" });
    await flush();

    expect(createAd).toHaveBeenCalledTimes(3);
    expect(result.current).toHaveLength(2);
    await unmount();
  });

  it("카드가 늘면 모자란 광고만 더 받는다", async () => {
    createAd.mockImplementation(async () => fakeAd());

    const { result, rerender, unmount } = await render(5);
    await flush();
    const [first] = result.current;

    await rerender({ count: 10, listKey: "a" });
    await flush();

    expect(createAd).toHaveBeenCalledTimes(2);
    expect(result.current).toHaveLength(2);
    expect(result.current[0]).toBe(first);
    await unmount();
  });

  it("목록이 바뀌면 받아 둔 광고를 해제하고 새로 받는다", async () => {
    const before = fakeAd();
    const after = fakeAd();
    createAd.mockResolvedValueOnce(before).mockResolvedValueOnce(after);

    const { result, rerender, unmount } = await render(5);
    await flush();

    await rerender({ count: 5, listKey: "b" });
    await flush();

    expect(before.destroy).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual([after]);
    await unmount();
  });

  it("화면에서 빠지면 받아 둔 광고와 늦게 온 광고를 모두 해제한다", async () => {
    const loaded = fakeAd();
    const late = fakeAd();
    let resolveLate: (ad: NativeAd) => void = () => undefined;
    createAd.mockResolvedValueOnce(loaded).mockReturnValueOnce(
      new Promise<NativeAd>((resolve) => {
        resolveLate = resolve;
      }),
    );

    const { unmount } = await render(10);
    await flush();
    await unmount();
    await act(async () => resolveLate(late));

    expect(loaded.destroy).toHaveBeenCalledTimes(1);
    expect(late.destroy).toHaveBeenCalledTimes(1);
  });

  it("못 받으면 카드가 더 늘 때까지 다시 요청하지 않는다", async () => {
    createAd
      .mockRejectedValueOnce(new Error("no fill"))
      .mockImplementation(async () => fakeAd());

    const { result, rerender, unmount } = await render(5);
    await flush();

    await rerender({ count: 9, listKey: "a" });
    await flush();

    expect(createAd).toHaveBeenCalledTimes(1);
    expect(result.current).toHaveLength(0);

    await rerender({ count: 10, listKey: "a" });
    await flush();

    expect(createAd).toHaveBeenCalledTimes(3);
    expect(result.current).toHaveLength(2);
    await unmount();
  });

  it("광고 준비가 끝나기 전에는 요청하지 않는다", async () => {
    let ready: () => void = () => undefined;
    mockReady.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        ready = resolve;
      }),
    );
    createAd.mockImplementation(async () => fakeAd());

    const { result, unmount } = await render(5);
    await flush();

    expect(createAd).not.toHaveBeenCalled();

    await act(async () => ready());
    await flush();

    expect(createAd).toHaveBeenCalledTimes(1);
    expect(result.current).toHaveLength(1);
    await unmount();
  });

  it("준비를 기다리는 사이 화면에서 빠지면 요청하지 않는다", async () => {
    let ready: () => void = () => undefined;
    mockReady.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        ready = resolve;
      }),
    );

    const { unmount } = await render(5);
    await unmount();
    await act(async () => ready());
    await flush();

    expect(createAd).not.toHaveBeenCalled();
  });
});
