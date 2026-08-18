import * as StoreReview from "expo-store-review";

import { maybeRequestReview, useReviewStore } from "@/lib/review/store";

jest.mock("@/lib/storage", () => ({
  storage: jest
    .requireActual("../../__tests__/memory-storage")
    .createMemoryStorage(),
}));
jest.mock("expo-store-review", () => ({
  hasAction: jest.fn(),
  requestReview: jest.fn(),
}));

const hasAction = jest.mocked(StoreReview.hasAction);
const requestReview = jest.mocked(StoreReview.requestReview);

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-08-18T00:00:00Z");

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers({ now: NOW });
  useReviewStore.setState({ firstSeenAt: null, lastRequestedAt: null });
  hasAction.mockResolvedValue(true);
  requestReview.mockResolvedValue(undefined);
});

afterEach(() => jest.useRealTimers());

describe("markFirstSeen", () => {
  it("처음 한 번만 기록한다", () => {
    useReviewStore.getState().markFirstSeen();
    jest.setSystemTime(NOW + DAY);
    useReviewStore.getState().markFirstSeen();

    expect(useReviewStore.getState().firstSeenAt).toBe(NOW);
  });
});

describe("maybeRequestReview", () => {
  it("처음 본 기록이 없으면 요청하지 않는다", async () => {
    await maybeRequestReview();

    expect(requestReview).not.toHaveBeenCalled();
  });

  it("사용한 지 3일이 안 됐으면 요청하지 않는다", async () => {
    useReviewStore.setState({ firstSeenAt: NOW - 3 * DAY + 1 });

    await maybeRequestReview();

    expect(requestReview).not.toHaveBeenCalled();
  });

  it("3일이 지났으면 요청하고 시각을 남긴다", async () => {
    useReviewStore.setState({ firstSeenAt: NOW - 3 * DAY });

    await maybeRequestReview();

    expect(requestReview).toHaveBeenCalledTimes(1);
    expect(useReviewStore.getState().lastRequestedAt).toBe(NOW);
  });

  it("마지막 요청 뒤 90일이 안 지났으면 다시 요청하지 않는다", async () => {
    useReviewStore.setState({
      firstSeenAt: NOW - 100 * DAY,
      lastRequestedAt: NOW - 90 * DAY + 1,
    });

    await maybeRequestReview();

    expect(requestReview).not.toHaveBeenCalled();
  });

  it("90일이 지났으면 다시 요청한다", async () => {
    useReviewStore.setState({
      firstSeenAt: NOW - 100 * DAY,
      lastRequestedAt: NOW - 90 * DAY,
    });

    await maybeRequestReview();

    expect(requestReview).toHaveBeenCalledTimes(1);
  });

  it("OS가 리뷰를 지원하지 않으면 요청도 기록도 하지 않는다", async () => {
    useReviewStore.setState({ firstSeenAt: NOW - 10 * DAY });
    hasAction.mockResolvedValue(false);

    await maybeRequestReview();

    expect(requestReview).not.toHaveBeenCalled();
    expect(useReviewStore.getState().lastRequestedAt).toBeNull();
  });

  it("요청이 실패해도 던지지 않고 기록은 남긴다", async () => {
    useReviewStore.setState({ firstSeenAt: NOW - 10 * DAY });
    requestReview.mockRejectedValue(new Error("no store"));

    await expect(maybeRequestReview()).resolves.toBeUndefined();
    expect(useReviewStore.getState().lastRequestedAt).toBe(NOW);
  });
});
