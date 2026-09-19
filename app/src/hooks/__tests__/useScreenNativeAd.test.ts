import { act, renderHook } from "@testing-library/react-native";
import { NativeAd } from "react-native-google-mobile-ads";

import {
  prefetchScreenNativeAd,
  useScreenNativeAd,
} from "@/hooks/useScreenNativeAd";

jest.mock("react-native-google-mobile-ads", () => ({
  NativeAd: { createForAdRequest: jest.fn() },
}));

const mockReady = jest.fn();

jest.mock("@/lib/ads", () => ({
  whenAdsReady: () => mockReady(),
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

const HOUR = 3_600_000;

function fakeAd(video = false) {
  return {
    destroy: jest.fn(),
    mediaContent: { aspectRatio: 1, hasVideoContent: video, duration: 0 },
  } as unknown as NativeAd;
}

function never() {
  return new Promise<NativeAd>(() => undefined);
}

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function setNow(time: number) {
  jest.spyOn(Date, "now").mockReturnValue(time);
}

async function focusAt(time: number) {
  setNow(time);
  await act(async () => mockFocus?.());
  await flush();
}

async function prefetch(unitId: string) {
  prefetchScreenNativeAd(unitId);
  await flush();
}

function render(enabled: boolean, unitId: string) {
  return renderHook(
    (props: { enabled: boolean }) => useScreenNativeAd(unitId, props.enabled),
    { initialProps: { enabled } },
  );
}

beforeEach(() => {
  jest.resetAllMocks();
  mockReady.mockImplementation(() => Promise.resolve());
  mockFocus = null;
  setNow(0);
});

describe("useScreenNativeAd", () => {
  it("미리 받아 둔 광고는 처음 들어올 때 바로 보여 준다", async () => {
    const ad = fakeAd();
    createAd.mockResolvedValueOnce(ad);

    await prefetch("prefetched");
    const { result, unmount } = await render(true, "prefetched");

    expect(createAd).toHaveBeenCalledTimes(1);
    expect(createAd).toHaveBeenCalledWith("prefetched");
    expect(result.current).toBe(ad);
    await unmount();
  });

  it("보는 중에 도착한 광고는 끼우지 않고 다음에 들어올 때 보여 준다", async () => {
    const ad = fakeAd();
    createAd.mockResolvedValueOnce(ad);

    const { result, unmount } = await render(true, "arriving");
    await flush();

    expect(createAd).toHaveBeenCalledTimes(1);
    expect(result.current).toBeNull();

    await focusAt(1_000);

    expect(result.current).toBe(ad);
    expect(createAd).toHaveBeenCalledTimes(1);
    await unmount();
  });

  it("채팅방이 없으면 보여 주지 않다가 생기면 들어올 때 꺼낸 광고를 함께 보여 준다", async () => {
    const ad = fakeAd();
    createAd.mockResolvedValueOnce(ad);

    await prefetch("empty");
    const { result, rerender, unmount } = await render(false, "empty");

    expect(result.current).toBeNull();

    await rerender({ enabled: true });

    expect(result.current).toBe(ad);
    await unmount();
  });

  it("채팅방이 없으면 들어와도 광고를 요청하지 않는다", async () => {
    const { unmount } = await render(false, "no-rooms");
    await focusAt(1_000);

    expect(createAd).not.toHaveBeenCalled();
    await unmount();
  });

  it("다시 들어왔을 때 1분이 지났으면 새로 받아 두고, 그다음에 들어올 때 바꾸며 이전 광고를 해제한다", async () => {
    const first = fakeAd();
    const second = fakeAd();
    createAd.mockResolvedValueOnce(first).mockResolvedValueOnce(second);

    await prefetch("refresh");
    const { result, unmount } = await render(true, "refresh");

    await focusAt(30_000);

    expect(createAd).toHaveBeenCalledTimes(1);

    await focusAt(60_000);

    expect(createAd).toHaveBeenCalledTimes(2);
    expect(result.current).toBe(first);

    await focusAt(61_000);

    expect(result.current).toBe(second);
    expect(first.destroy).toHaveBeenCalledTimes(1);
    expect(second.destroy).not.toHaveBeenCalled();
    await unmount();
  });

  it("새 광고를 못 받으면 보던 광고를 그대로 둔다", async () => {
    const ad = fakeAd();
    createAd.mockResolvedValueOnce(ad).mockRejectedValue(new Error("no fill"));

    await prefetch("failing");
    const { result, unmount } = await render(true, "failing");
    await focusAt(60_000);
    await focusAt(61_000);

    expect(result.current).toBe(ad);
    expect(ad.destroy).not.toHaveBeenCalled();
    await unmount();
  });

  it("동영상 광고는 남겨 두지 않고 해제한다", async () => {
    const ad = fakeAd(true);
    createAd.mockResolvedValueOnce(ad).mockReturnValue(never());

    const { result, unmount } = await render(true, "video");
    await flush();
    await focusAt(1_000);

    expect(result.current).toBeNull();
    expect(ad.destroy).toHaveBeenCalledTimes(1);
    await unmount();
  });

  it("받은 지 한 시간이 넘은 광고는 보여 주지 않고 해제한 뒤 새로 받는다", async () => {
    const stale = fakeAd();
    const fresh = fakeAd();
    createAd.mockResolvedValueOnce(stale).mockResolvedValueOnce(fresh);

    await prefetch("expired");
    setNow(HOUR);
    const { result, unmount } = await render(true, "expired");
    await flush();

    expect(stale.destroy).toHaveBeenCalledTimes(1);
    expect(result.current).toBeNull();

    await focusAt(HOUR + 1_000);

    expect(result.current).toBe(fresh);
    await unmount();
  });

  it("보던 광고도 한 시간이 지나 다시 들어오면 내리고 해제한다", async () => {
    const ad = fakeAd();
    createAd.mockResolvedValueOnce(ad).mockReturnValue(never());

    await prefetch("aging");
    const { result, unmount } = await render(true, "aging");
    await focusAt(HOUR);

    expect(result.current).toBeNull();
    expect(ad.destroy).toHaveBeenCalledTimes(1);
    await unmount();
  });

  it("화면에서 빠지면 보던 광고는 해제하고 늦게 온 광고는 다음에 들어올 때 쓴다", async () => {
    const shown = fakeAd();
    const late = fakeAd();
    let resolveLate: (ad: NativeAd) => void = () => undefined;
    createAd.mockResolvedValueOnce(shown).mockReturnValueOnce(
      new Promise<NativeAd>((resolve) => {
        resolveLate = resolve;
      }),
    );

    await prefetch("remount");
    const before = await render(true, "remount");
    await focusAt(60_000);
    await before.unmount();
    await act(async () => resolveLate(late));

    expect(shown.destroy).toHaveBeenCalledTimes(1);
    expect(late.destroy).not.toHaveBeenCalled();

    const after = await render(true, "remount");

    expect(after.result.current).toBe(late);
    await after.unmount();
  });

  it("광고 준비가 끝나기 전에는 요청하지 않는다", async () => {
    let ready: () => void = () => undefined;
    mockReady.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        ready = resolve;
      }),
    );
    createAd.mockResolvedValueOnce(fakeAd());

    await prefetch("waiting");

    expect(createAd).not.toHaveBeenCalled();

    await act(async () => ready());
    await flush();

    expect(createAd).toHaveBeenCalledWith("waiting");
  });
});
