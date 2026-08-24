import { useEffect } from "react";
import { create } from "zustand";

export type LoadingProgress = { done: number; total: number };

type LoadingOverlayState = {
  visible: boolean;
  progress: LoadingProgress | null;
  setState: (visible: boolean, progress: LoadingProgress | null) => void;
};

export const useLoadingOverlayStore = create<LoadingOverlayState>((set) => ({
  visible: false,
  progress: null,
  setState: (visible, progress) => set({ visible, progress }),
}));

export function useLoadingOverlay(visible: boolean, done = 0, total = 0) {
  const setState = useLoadingOverlayStore((state) => state.setState);

  useEffect(() => {
    setState(visible, total > 1 ? { done, total } : null);

    return () => setState(false, null);
  }, [setState, visible, done, total]);
}
