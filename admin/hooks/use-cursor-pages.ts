import { useState } from "react";

export function useCursorPages() {
  const [keys, setKeys] = useState<string[]>([]);
  const startKey = keys.length > 0 ? keys[keys.length - 1] : undefined;

  return {
    startKey,
    hasPrevious: keys.length > 0,
    next: (nextKey: string) => setKeys((current) => [...current, nextKey]),
    previous: () => setKeys((current) => current.slice(0, -1)),
    reset: () => setKeys([]),
  };
}
