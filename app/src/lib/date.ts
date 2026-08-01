function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatDateTime(isoString: string) {
  const date = new Date(isoString);
  const day = `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;

  return `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
