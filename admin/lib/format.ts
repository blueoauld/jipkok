const dateTimeFormat = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "Asia/Seoul",
});

const dateFormat = new Intl.DateTimeFormat("ko-KR", {
  month: "numeric",
  day: "numeric",
  timeZone: "Asia/Seoul",
});

export function formatDateTime(iso: string) {
  return dateTimeFormat
    .format(new Date(iso))
    .replace(/-/g, "/")
    .replace(",", "");
}

export function formatDate(iso: string) {
  return dateFormat.format(new Date(iso));
}

export function formatCount(value: number) {
  return value.toLocaleString("ko-KR");
}
