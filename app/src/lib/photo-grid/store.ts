import { create } from "zustand";
import { persist } from "zustand/middleware";

import { storage } from "@/lib/storage";

const PHOTO_GRID_STORAGE_KEY = "jipkok.profilePhotoGrid";

type PhotoGridState = {
  open: boolean;
  toggle: () => void;
};

export const usePhotoGridStore = create<PhotoGridState>()(
  persist(
    (set) => ({
      open: false,
      toggle: () => set((state) => ({ open: !state.open })),
    }),
    {
      name: PHOTO_GRID_STORAGE_KEY,
      storage,
      partialize: (state) => ({ open: state.open }),
    },
  ),
);
