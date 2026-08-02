import { create } from "zustand";
import { persist } from "zustand/middleware";

import { storage } from "@/lib/storage";

const NOTE_STORAGE_KEY = "jipkok.note";

type NoteState = {
  content: string;
  setContent: (content: string) => void;
};

export const useNoteStore = create<NoteState>()(
  persist(
    (set) => ({
      content: "",
      setContent: (content) => set({ content }),
    }),
    {
      name: NOTE_STORAGE_KEY,
      storage,
      partialize: (state) => ({ content: state.content }),
    },
  ),
);
