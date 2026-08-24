import i18n from "@/lib/i18n";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatDateTime(isoString: string) {
  const date = new Date(isoString);
  const day = i18n.t("date.fullDate", {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });

  return `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatRelativeTime(isoString: string, now = Date.now()) {
  const elapsed = now - new Date(isoString).getTime();

  if (elapsed < MINUTE) {
    return i18n.t("date.justNow");
  }

  if (elapsed < HOUR) {
    return i18n.t("date.minutesAgo", { count: Math.floor(elapsed / MINUTE) });
  }

  if (elapsed < DAY) {
    return i18n.t("date.hoursAgo", { count: Math.floor(elapsed / HOUR) });
  }

  return i18n.t("date.daysAgo", { count: Math.floor(elapsed / DAY) });
}

export function toDateParam(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDateParam(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

export function isSameDay(left: Date, right: Date) {
  return toDateParam(left) === toDateParam(right);
}

export function isToday(date: Date) {
  return isSameDay(date, new Date());
}

export function formatDateLabel(date: Date) {
  if (isToday(date)) {
    return i18n.t("date.today");
  }

  return monthDay(date);
}

export function formatClockTime(date: Date) {
  const hours = date.getHours();

  return i18n.t("date.clock", {
    meridiem: i18n.t(hours < 12 ? "date.am" : "date.pm"),
    hour: hours % 12 || 12,
    minute: pad(date.getMinutes()),
  });
}

export function formatChatTime(isoString: string) {
  const date = new Date(isoString);
  const today = new Date();

  if (isSameDay(date, today)) {
    return formatClockTime(date);
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(date, yesterday)) {
    return i18n.t("date.yesterday");
  }

  if (date.getFullYear() === today.getFullYear()) {
    return monthDay(date);
  }

  return i18n.t("date.fullDate", {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });
}

export function formatSlotTime(isoString: string) {
  const date = new Date(isoString);

  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatFullDate(date: Date) {
  return i18n.t("date.yearMonthDay", {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });
}

function monthDay(date: Date) {
  return i18n.t("date.monthDay", {
    month: date.getMonth() + 1,
    day: date.getDate(),
  });
}
