import { act, renderHook } from "@testing-library/react-native";
import { AppState, type AppStateStatus } from "react-native";

import { useAppLock } from "@/hooks/useAppLock";
import { RELOCK_AFTER_MILLIS } from "@/lib/lock";
import { useAppLockStore } from "@/lib/lock/store";

jest.mock("expo-local-authentication", () => ({}));

type Listener = (state: AppStateStatus) => void;

const NOW = Date.parse("2026-09-03T00:00:00Z");

type Setup = Awaited<ReturnType<typeof renderHook<void, void>>> & {
  change: (state: AppStateStatus) => Promise<void>;
  subscribed: () => boolean;
  remove: jest.Mock;
};

let mounted: Setup | null = null;

async function setup(enabled = true): Promise<Setup> {
  let listener: Listener | null = null;
  const remove = jest.fn();

  jest
    .mocked(AppState.addEventListener)
    .mockImplementation((_, next: Listener) => {
      listener = next;
      return { remove };
    });
  useAppLockStore.setState({ enabled, locked: false });

  const hook = await renderHook(() => useAppLock());

  mounted = {
    ...hook,
    // act를 기다리지 않으면 다음 테스트의 렌더가 act 큐에 갇혀 훅이 렌더되지 않는다.
    change: (state) =>
      act(async () => {
        listener?.(state);
      }),
    subscribed: () => listener !== null,
    remove,
  };

  return mounted;
}

let now: jest.SpyInstance<number, []>;

beforeEach(() => {
  now = jest.spyOn(Date, "now").mockReturnValue(NOW);
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
});

it("기준 시간 이상 백그라운드에 있다 돌아오면 잠근다", async () => {
  const hook = await setup();

  await hook.change("background");
  now.mockReturnValue(NOW + RELOCK_AFTER_MILLIS);
  await hook.change("active");

  expect(useAppLockStore.getState().locked).toBe(true);
});

it("잠깐 나갔다 오면 잠그지 않는다", async () => {
  const hook = await setup();

  await hook.change("background");
  now.mockReturnValue(NOW + RELOCK_AFTER_MILLIS - 1);
  await hook.change("active");

  expect(useAppLockStore.getState().locked).toBe(false);
});

it("inactive만 거쳐 돌아오면 잠그지 않는다", async () => {
  const hook = await setup();

  await hook.change("inactive");
  now.mockReturnValue(NOW + RELOCK_AFTER_MILLIS * 2);
  await hook.change("active");

  expect(useAppLockStore.getState().locked).toBe(false);
});

it("돌아온 뒤 다시 나가면 나간 시각을 새로 센다", async () => {
  const hook = await setup();

  await hook.change("background");
  await hook.change("active");
  now.mockReturnValue(NOW + RELOCK_AFTER_MILLIS * 2);
  await hook.change("background");
  await hook.change("active");

  expect(useAppLockStore.getState().locked).toBe(false);
});

it("꺼져 있으면 앱 상태를 구독하지 않는다", async () => {
  const hook = await setup(false);

  expect(hook.subscribed()).toBe(false);
});

it("내려가면 구독을 해제한다", async () => {
  const hook = await setup();

  await hook.unmount();

  expect(hook.remove).toHaveBeenCalledTimes(1);
});
