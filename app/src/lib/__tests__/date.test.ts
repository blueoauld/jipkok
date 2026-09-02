import {
  formatChatTime,
  formatClockTime,
  formatCountdown,
  formatDateLabel,
  formatDateTime,
  formatFullDate,
  formatRelativeTime,
  formatSlotTime,
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
});

describe("date labels", () => {
  it("오늘 판정과 라벨", () => {
    const today = new Date();

    expect(isToday(today)).toBe(true);
    expect(formatDateLabel(today)).toBe("오늘");
    expect(formatDateLabel(new Date(2026, 0, 9))).toBe("1월 9일");
    expect(formatFullDate(new Date(2026, 0, 9))).toBe("2026년 1월 9일");
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-08-18T12:00:00Z").getTime();
  const at = (secondsAgo: number) =>
    new Date(now - secondsAgo * 1000).toISOString();

  it("경계마다 단위가 바뀐다", () => {
    expect(formatRelativeTime(at(59), now)).toBe("방금 전");
    expect(formatRelativeTime(at(60), now)).toBe("1분 전");
    expect(formatRelativeTime(at(59 * 60), now)).toBe("59분 전");
    expect(formatRelativeTime(at(60 * 60), now)).toBe("1시간 전");
    expect(formatRelativeTime(at(23 * 60 * 60), now)).toBe("23시간 전");
    expect(formatRelativeTime(at(24 * 60 * 60), now)).toBe("1일 전");
  });
});

describe("clock formats", () => {
  it("오전/오후와 12시간제로 만든다", () => {
    expect(formatClockTime(new Date(2026, 0, 1, 0, 5))).toBe("오전 12:05");
    expect(formatClockTime(new Date(2026, 0, 1, 11, 59))).toBe("오전 11:59");
    expect(formatClockTime(new Date(2026, 0, 1, 12, 0))).toBe("오후 12:00");
    expect(formatClockTime(new Date(2026, 0, 1, 23, 7))).toBe("오후 11:07");
  });

  it("날짜시각은 연월일 표기를 따르고 슬롯 시각은 두 자리로 채운다", () => {
    const iso = new Date(2026, 2, 4, 9, 3).toISOString();

    expect(formatDateTime(iso)).toBe("2026. 3. 4. 09:03");
    expect(formatSlotTime(iso)).toBe("09:03");
  });
});

describe("formatChatTime", () => {
  it("오늘은 시각, 어제는 어제, 올해는 월일, 그 전은 연월일", () => {
    const today = new Date();
    today.setHours(15, 30, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);
    const lastYear = new Date(today.getFullYear() - 1, 11, 25, 10, 0);

    expect(formatChatTime(today.toISOString())).toBe("오후 3:30");
    expect(formatChatTime(yesterday.toISOString())).toBe("어제");
    expect(formatChatTime(threeDaysAgo.toISOString())).toBe(
      threeDaysAgo.getFullYear() === today.getFullYear()
        ? `${threeDaysAgo.getMonth() + 1}월 ${threeDaysAgo.getDate()}일`
        : `${threeDaysAgo.getFullYear()}. ${threeDaysAgo.getMonth() + 1}. ${threeDaysAgo.getDate()}.`,
    );
    expect(formatChatTime(lastYear.toISOString())).toBe(
      `${today.getFullYear() - 1}. 12. 25.`,
    );
  });
});

describe("formatCountdown", () => {
  it("남은 초를 분:초로 적고 초는 두 자리로 채운다", () => {
    expect(formatCountdown(180)).toBe("3:00");
    expect(formatCountdown(65)).toBe("1:05");
    expect(formatCountdown(9)).toBe("0:09");
    expect(formatCountdown(0)).toBe("0:00");
  });
});
