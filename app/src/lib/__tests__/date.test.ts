import {
  formatDateLabel,
  formatFullDate,
  fromDateParam,
  isToday,
  toDateParam,
} from "@/lib/date";

describe("date params", () => {
  it("YYYY-MM-DD로 오가며 같은 날짜를 유지한다", () => {
    const date = new Date(2026, 7, 5);

    expect(toDateParam(date)).toBe("2026-08-05");
    expect(fromDateParam("2026-08-05").getTime()).toBe(date.getTime());
  });

  it("오늘 판정과 라벨", () => {
    const today = new Date();

    expect(isToday(today)).toBe(true);
    expect(formatDateLabel(today)).toBe("오늘");
    expect(formatDateLabel(new Date(2026, 0, 9))).toBe("1월 9일");
    expect(formatFullDate(new Date(2026, 0, 9))).toBe("2026년 1월 9일");
  });
});
