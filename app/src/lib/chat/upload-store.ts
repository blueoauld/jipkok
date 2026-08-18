import { create } from "zustand";

// 영상 메시지는 압축·업로드에 몇 초~몇십 초가 걸려서 말풍선에 진행 상황을 보여준다.
// 임시 메시지의 clientMessageId로 찾는다.
export type UploadPhase = "compressing" | "uploading" | "failed";

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
}));

export function useUploadState(clientMessageId: string | null | undefined) {
  return useUploadStore((state) =>
    clientMessageId ? state.uploads[clientMessageId] : undefined,
  );
}
