import { create } from "zustand";

// 텍스트도 재조회에 지워지지 않도록 보내는 동안 여기 올린다. 화면은 실패만 그린다.
export type UploadPhase = "sending" | "compressing" | "uploading" | "failed";

export type UploadState = {
  phase: UploadPhase;
  progress: number;
  cancel: () => void;
  retry: () => void;
};

type UploadStore = {
  uploads: Record<string, UploadState>;
  set: (id: string, state: UploadState) => void;
  progress: (id: string, phase: UploadPhase, progress: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useUploadStore = create<UploadStore>((set) => ({
  uploads: {},
  set: (id, state) =>
    set((current) => ({ uploads: { ...current.uploads, [id]: state } })),
  progress: (id, phase, progress) =>
    set((current) => {
      const existing = current.uploads[id];

      return existing
        ? {
            uploads: {
              ...current.uploads,
              [id]: { ...existing, phase, progress },
            },
          }
        : current;
    }),
  remove: (id) =>
    set((current) => {
      const { [id]: _removed, ...uploads } = current.uploads;

      return { uploads };
    }),
  clear: () => set({ uploads: {} }),
}));

export function useUploadState(clientMessageId: string | null | undefined) {
  return useUploadStore((state) =>
    clientMessageId ? state.uploads[clientMessageId] : undefined,
  );
}
