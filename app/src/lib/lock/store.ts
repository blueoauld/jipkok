import { create } from "zustand";
import { persist } from "zustand/middleware";

import { storage } from "@/lib/storage";

const STORAGE_KEY = "jipkok.lock";

type LockState = {
  enabled: boolean;
  locked: boolean;
  setEnabled: (enabled: boolean) => void;
  lock: () => void;
  unlock: () => void;
};

export const useAppLockStore = create<LockState>()(
  persist(
    (set) => ({
      enabled: false,
      locked: false,
      setEnabled: (enabled) => set({ enabled, locked: false }),
      lock: () => set({ locked: true }),
      unlock: () => set({ locked: false }),
    }),
    {
      name: STORAGE_KEY,
      storage,
      partialize: (state) => ({ enabled: state.enabled }),
      // 켜 둔 채 앱을 다시 열면 첫 화면부터 잠겨 있어야 한다.
      merge: (persisted, current) => {
        const enabled =
          (persisted as { enabled?: boolean } | undefined)?.enabled === true;

        return { ...current, enabled, locked: enabled };
      },
    },
  ),
);
