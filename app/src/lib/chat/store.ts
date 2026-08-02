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
