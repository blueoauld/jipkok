import { create } from "zustand";
import { persist } from "zustand/middleware";

import { storage } from "@/lib/storage";

const CAPTURE_NOTICE_STORAGE_KEY = "jipkok.secretPhotoCaptureNotice";

type CaptureNoticeState = {
  seen: boolean;
  markSeen: () => void;
};

export const useCaptureNoticeStore = create<CaptureNoticeState>()(
  persist(
    (set) => ({
      seen: false,
      markSeen: () => set({ seen: true }),
    }),
    {
      name: CAPTURE_NOTICE_STORAGE_KEY,
      storage,
      partialize: (state) => ({ seen: state.seen }),
    },
  ),
);
