import { act, renderHook } from "@testing-library/react-native";
import { useInterstitialAd } from "react-native-google-mobile-ads";

import { useInterstitialGate } from "@/hooks/useInterstitialGate";
import { pushOnce } from "@/lib/router";

jest.mock("react-native-google-mobile-ads", () => ({
  useInterstitialAd: jest.fn(),
}));
jest.mock("@/lib/ads", () => ({ INTERSTITIAL_AD_UNIT_ID: "unit" }));
jest.mock("@/lib/router", () => ({ pushOnce: jest.fn() }));

const useAd = jest.mocked(useInterstitialAd);
const push = jest.mocked(pushOnce);

const load = jest.fn();
const show = jest.fn();

function adState(state: Partial<ReturnType<typeof useInterstitialAd>>) {
  return {
    isLoaded: false,
    isClosed: false,
    isOpened: false,
    isClicked: false,
    isShowing: false,
    error: undefined,
    reward: undefined,
    revenue: undefined,
    load,
    show,
    ...state,
  } as ReturnType<typeof useInterstitialAd>;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useInterstitialGate", () => {
  it("마운트되면 광고를 미리 불러온다", async () => {
    useAd.mockReturnValue(adState({}));

    const { unmount } = await renderHook(() => useInterstitialGate());

    expect(load).toHaveBeenCalledTimes(1);
    await unmount();
  });

  it("광고가 준비되지 않았으면 바로 이동한다", async () => {
    useAd.mockReturnValue(adState({ isLoaded: false }));
    const { result, unmount } = await renderHook(() => useInterstitialGate());

    await act(async () => result.current.open("/member/1"));

    expect(push).toHaveBeenCalledWith("/member/1");
    expect(show).not.toHaveBeenCalled();
    await unmount();
  });

  it("광고가 준비됐으면 먼저 보여 주고 닫힌 뒤 이동하며 다음 광고를 불러온다", async () => {
    useAd.mockReturnValue(adState({ isLoaded: true }));
    const { result, rerender, unmount } = await renderHook(() =>
      useInterstitialGate(),
    );

    await act(async () => result.current.open("/member/1"));

    expect(show).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();

    useAd.mockReturnValue(adState({ isLoaded: false, isClosed: true }));
    await rerender(undefined);

    expect(push).toHaveBeenCalledWith("/member/1");
    expect(load).toHaveBeenCalledTimes(2);
    await unmount();
  });

  it("동작도 광고가 닫힌 뒤에 실행한다", async () => {
    const action = jest.fn();
    useAd.mockReturnValue(adState({ isLoaded: true }));
    const { result, rerender, unmount } = await renderHook(() =>
      useInterstitialGate(),
    );

    await act(async () => result.current.run(action));

    expect(show).toHaveBeenCalledTimes(1);
    expect(action).not.toHaveBeenCalled();

    useAd.mockReturnValue(adState({ isLoaded: false, isClosed: true }));
    await rerender(undefined);

    expect(action).toHaveBeenCalledTimes(1);
    await unmount();
  });

  it("광고가 실패하면 기다리지 않고 이동한다", async () => {
    useAd.mockReturnValue(adState({ isLoaded: true }));
    const { result, rerender, unmount } = await renderHook(() =>
      useInterstitialGate(),
    );

    await act(async () => result.current.open("/member/1"));

    useAd.mockReturnValue(adState({ error: new Error("no fill") }));
    await rerender(undefined);

    expect(push).toHaveBeenCalledWith("/member/1");
    await unmount();
  });
});
