import {
  DEFAULT_MEMBER_FILTER,
  isDefaultMemberFilter,
  useFeedFilterStore,
  useMemberFilterStore,
} from "@/lib/filter/store";

describe("useFeedFilterStore.setDate", () => {
  it("오늘을 고르면 null로 두어 자정이 지나도 오늘을 따라간다", () => {
    useFeedFilterStore.getState().setDate(new Date());

    expect(useFeedFilterStore.getState().date).toBeNull();
  });

  it("다른 날을 고르면 날짜 문자열로 박아 둔다", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    useFeedFilterStore.getState().setDate(yesterday);

    expect(useFeedFilterStore.getState().date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("필터 저장 옵션", () => {
  it("피드 필터는 날짜를 저장하지 않는다", () => {
    const partialize = useFeedFilterStore.persist.getOptions().partialize;

    expect(
      partialize?.({ ...useFeedFilterStore.getState(), date: "2026-08-01" }),
    ).toEqual({
      board: "FEED",
      sort: "LATEST",
      worrySort: "LATEST",
      worryCategory: null,
    });
  });

  it("옛 피드 필터 저장값에서 정렬만 남기고 없는 항목은 기본값으로 채운다", () => {
    const migrate = useFeedFilterStore.persist.getOptions().migrate;

    expect(migrate?.({ sort: "OLDEST", gender: "FEMALE" }, 1)).toEqual({
      sort: "OLDEST",
    });
    expect(migrate?.(undefined, 0)).toEqual({ sort: "LATEST" });
  });

  it("회원 필터는 정렬, 성별, 나이 범위를 저장한다", () => {
    const partialize = useMemberFilterStore.persist.getOptions().partialize;

    useMemberFilterStore.getState().setSort("DISTANCE");
    useMemberFilterStore
      .getState()
      .setFilter({ gender: "MALE", minAge: 25, maxAge: 35 });

    expect(partialize?.(useMemberFilterStore.getState())).toEqual({
      sort: "DISTANCE",
      gender: "MALE",
      minAge: 25,
      maxAge: 35,
    });
  });
});

describe("고민 분류", () => {
  it("기본값은 전체다", () => {
    expect(useFeedFilterStore.getState().worryCategory).toBeNull();
  });

  it("고른 분류를 담아 둔다", () => {
    useFeedFilterStore.getState().setWorryCategory("LOVE");

    expect(useFeedFilterStore.getState().worryCategory).toBe("LOVE");
  });
});

describe("isDefaultMemberFilter", () => {
  it("기본값 그대로면 참이다", () => {
    expect(isDefaultMemberFilter(DEFAULT_MEMBER_FILTER)).toBe(true);
  });

  it("성별이나 나이 하나만 달라도 거짓이다", () => {
    expect(
      isDefaultMemberFilter({ ...DEFAULT_MEMBER_FILTER, gender: "MALE" }),
    ).toBe(false);
    expect(
      isDefaultMemberFilter({ ...DEFAULT_MEMBER_FILTER, minAge: 25 }),
    ).toBe(false);
    expect(
      isDefaultMemberFilter({ ...DEFAULT_MEMBER_FILTER, maxAge: 40 }),
    ).toBe(false);
  });
});
