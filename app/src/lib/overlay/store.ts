import { useEffect } from "react";
import { create } from "zustand";

type LoadingOverlayState = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
};

export const useLoadingOverlayStore = create<LoadingOverlayState>((set) => ({
  visible: false,
  setVisible: (visible) => set({ visible }),
}));

export function useLoadingOverlay(visible: boolean) {
  const setVisible = useLoadingOverlayStore((state) => state.setVisible);

  useEffect(() => {
    setVisible(visible);

    return () => setVisible(false);
  }, [setVisible, visible]);
}
