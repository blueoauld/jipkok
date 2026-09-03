import { create } from "zustand";
import { persist } from "zustand/middleware";

import { storage } from "@/lib/storage";

const STORAGE_KEY = "jipkok.chat-drafts";

type DraftStore = {
  drafts: Record<number, string>;
  set: (roomId: number, text: string) => void;
  clear: (roomId: number) => void;
  clearAll: () => void;
};

function without(drafts: Record<number, string>, roomId: number) {
  const { [roomId]: _removed, ...rest } = drafts;

  return rest;
}

// 빈 글은 지워서 나간 방의 흔적이 저장소에 쌓이지 않게 한다.
export const useChatDraftStore = create<DraftStore>()(
  persist(
    (set) => ({
      drafts: {},
      set: (roomId, text) =>
        set((current) => ({
          drafts:
            text.length === 0
              ? without(current.drafts, roomId)
              : { ...current.drafts, [roomId]: text },
        })),
      clear: (roomId) =>
        set((current) => ({ drafts: without(current.drafts, roomId) })),
      clearAll: () => set({ drafts: {} }),
    }),
    {
      name: STORAGE_KEY,
      storage,
      partialize: (state) => ({ drafts: state.drafts }),
    },
  ),
);

export function clearChatDraft(roomId: number) {
  useChatDraftStore.getState().clear(roomId);
}
