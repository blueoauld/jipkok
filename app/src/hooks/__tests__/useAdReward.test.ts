import { waitForReward } from "@/hooks/useAdReward";

jest.mock("react-native-google-mobile-ads", () => ({
  useRewardedAd: jest.fn(),
}));
jest.mock("@/lib/ads", () => ({ REWARDED_AD_UNIT_ID: "unit" }));

describe("waitForReward", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const signal = () => new AbortController().signal;

  async function run(promise: Promise<unknown>, ticks: number) {
    for (let index = 0; index < ticks; index++) {
      await jest.advanceTimersByTimeAsync(10);
    }

    return promise;
  }

  it("잔액이 늘면 바로 rewarded", async () => {
    const fetchBalance = jest
      .fn()
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(130);
    const promise = waitForReward(100, fetchBalance, signal(), 10, 6);

    await expect(run(promise, 2)).resolves.toBe("rewarded");
    expect(fetchBalance).toHaveBeenCalledTimes(2);
  });

  it("횟수를 다 써도 그대로면 pending", async () => {
    const fetchBalance = jest.fn().mockResolvedValue(100);
    const promise = waitForReward(100, fetchBalance, signal(), 10, 3);

    await expect(run(promise, 3)).resolves.toBe("pending");
    expect(fetchBalance).toHaveBeenCalledTimes(3);
  });

  it("이전 잔액을 모르면 늘었는지 판단할 수 없어 unknown", async () => {
    const fetchBalance = jest.fn().mockResolvedValue(999);
    const promise = waitForReward(null, fetchBalance, signal(), 10, 2);

    await expect(run(promise, 2)).resolves.toBe("unknown");
  });

  it("조회 실패는 건너뛰고 다음 시도에서 잡는다", async () => {
    const fetchBalance = jest
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(150);
    const promise = waitForReward(100, fetchBalance, signal(), 10, 6);

    await expect(run(promise, 2)).resolves.toBe("rewarded");
  });

  it("중단하면 더 조회하지 않고 거절된다", async () => {
    const controller = new AbortController();
    const fetchBalance = jest.fn().mockResolvedValue(100);
    const promise = waitForReward(100, fetchBalance, controller.signal, 10, 6);
    const settled = promise.catch((error: Error) => error.message);

    await jest.advanceTimersByTimeAsync(10);
    controller.abort();

    await expect(settled).resolves.toBe("aborted");
    expect(fetchBalance).toHaveBeenCalledTimes(1);
  });
});
