export function isOutdated(current: string, latest: string) {
  const currentParts = current.split(".").map(Number);
  const latestParts = latest.split(".").map(Number);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const gap = (latestParts[i] ?? 0) - (currentParts[i] ?? 0);

    if (gap !== 0) {
      return gap > 0;
    }
  }

  return false;
}
