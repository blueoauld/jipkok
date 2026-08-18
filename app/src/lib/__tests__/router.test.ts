import { router } from "expo-router";

import { pushOnce } from "@/lib/router";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

const push = jest.mocked(router.push);

let base = 0;

// 마지막 이동 기록이 모듈에 남으므로 테스트마다 시각을 멀리 떨어뜨린다.
beforeEach(() => {
  jest.clearAllMocks();
  base += 60_000;
  jest.useFakeTimers({ now: base });
});

afterEach(() => jest.useRealTimers());

describe("pushOnce", () => {
  it("같은 경로를 짧은 시간 안에 두 번 밀면 한 번만 이동한다", () => {
    pushOnce("/member/1");
    pushOnce("/member/1");

    expect(push).toHaveBeenCalledTimes(1);
  });

  it("다른 경로는 바로 이동한다", () => {
    pushOnce("/member/1");
    pushOnce("/member/2");

    expect(push).toHaveBeenCalledTimes(2);
  });

  it("시간이 지나면 같은 경로도 다시 이동한다", () => {
    pushOnce("/member/1");
    jest.advanceTimersByTime(700);
    pushOnce("/member/1");

    expect(push).toHaveBeenCalledTimes(2);
  });

  it("객체 경로도 내용이 같으면 중복으로 본다", () => {
    pushOnce({ pathname: "/member/[id]", params: { id: "1" } });
    pushOnce({ pathname: "/member/[id]", params: { id: "1" } });

    expect(push).toHaveBeenCalledTimes(1);
  });
});
