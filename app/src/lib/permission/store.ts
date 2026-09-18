import { create } from "zustand";
import { persist } from "zustand/middleware";

import { storage } from "@/lib/storage";

const STORAGE_KEY = "jipkok.permissionNotice";

type PermissionNoticeState = {
  seen: boolean;
  markSeen: () => void;
};

export const usePermissionNoticeStore = create<PermissionNoticeState>()(
  persist(
    (set) => ({
      seen: false,
      markSeen: () => set({ seen: true }),
    }),
    {
      name: STORAGE_KEY,
      storage,
      version: 1,
      partialize: (state) => ({ seen: state.seen }),
    },
  ),
);
