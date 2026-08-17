import { create } from "zustand";

type ToastVariant = "info" | "warning" | "error";

type Toast = {
  id: number;
  variant: ToastVariant;
  message: string;
};

type ToastState = {
  toast: Toast | null;
  show: (variant: ToastVariant, message: string) => void;
  hide: () => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  show: (variant, message) =>
    set((state) => ({
      toast: { id: (state.toast?.id ?? 0) + 1, variant, message },
    })),
  hide: () => set({ toast: null }),
}));

export function showToast(variant: ToastVariant, message: string) {
  useToastStore.getState().show(variant, message);
}
