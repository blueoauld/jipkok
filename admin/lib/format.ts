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

const isoDateFormat = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
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

export function formatIsoDate(date: Date) {
  return isoDateFormat.format(date);
}

export function formatMoney(value: number, currency?: string | null) {
  if (!currency) return value.toFixed(2);
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    value,
  );
}

export function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}
