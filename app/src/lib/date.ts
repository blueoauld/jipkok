function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatDateTime(isoString: string) {
  const date = new Date(isoString);
  const day = `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;

  return `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatRelativeTime(isoString: string, now = Date.now()) {
  const elapsed = now - new Date(isoString).getTime();

  if (elapsed < MINUTE) {
    return "방금 전";
  }

  if (elapsed < HOUR) {
    return `${Math.floor(elapsed / MINUTE)}분 전`;
  }

  if (elapsed < DAY) {
    return `${Math.floor(elapsed / HOUR)}시간 전`;
  }

  return `${Math.floor(elapsed / DAY)}일 전`;
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

export function formatDateLabel(date: Date) {
  if (isSameDay(date, new Date())) {
    return "오늘";
  }

  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function formatChatTime(isoString: string) {
  const date = new Date(isoString);
  const today = new Date();

  if (isSameDay(date, today)) {
    const hours = date.getHours();

    return `${hours < 12 ? "오전" : "오후"} ${hours % 12 || 12}:${pad(date.getMinutes())}`;
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(date, yesterday)) {
    return "어제";
  }

  if (date.getFullYear() === today.getFullYear()) {
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  }

  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
}

export function formatSlotTime(isoString: string) {
  const date = new Date(isoString);

  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
