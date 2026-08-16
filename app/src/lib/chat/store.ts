import { create } from "zustand";

type DeletedRoomState = {
  roomId: number | null;
  markDeleted: (roomId: number) => void;
  clear: () => void;
};

export const useDeletedRoomStore = create<DeletedRoomState>((set) => ({
  roomId: null,
  markDeleted: (roomId) => set({ roomId }),
  clear: () => set({ roomId: null }),
}));

type ChatSelectionState = {
  active: boolean;
  selected: Set<number>;
  roomIds: number[];
  start: () => void;
  end: () => void;
  toggle: (roomId: number) => void;
  setRoomIds: (roomIds: number[]) => void;
  selectAll: () => void;
  clear: () => void;
};

export const useChatSelectionStore = create<ChatSelectionState>((set) => ({
  active: false,
  selected: new Set(),
  roomIds: [],
  start: () => set({ active: true, selected: new Set() }),
  end: () => set({ active: false, selected: new Set() }),
  toggle: (roomId) =>
    set((state) => {
      const selected = new Set(state.selected);

      if (!selected.delete(roomId)) {
        selected.add(roomId);
      }

      return { selected };
    }),
  setRoomIds: (roomIds) => set({ roomIds }),
  selectAll: () => set((state) => ({ selected: new Set(state.roomIds) })),
  clear: () => set({ selected: new Set() }),
}));
