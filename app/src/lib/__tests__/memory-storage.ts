import { createJSONStorage } from "zustand/middleware";

export function createMemoryStorage() {
  const map = new Map<string, string>();

  return createJSONStorage(() => ({
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  }));
}
