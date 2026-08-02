import { useSyncExternalStore } from "react";

const TICK_INTERVAL = 60_000;

let now = Date.now();
let timer: ReturnType<typeof setInterval> | null = null;

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);

  timer ??= setInterval(() => {
    now = Date.now();
    listeners.forEach((notify) => notify());
  }, TICK_INTERVAL);

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

export function useNow() {
  return useSyncExternalStore(
    subscribe,
    () => now,
    () => now,
  );
}
