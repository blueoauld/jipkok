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

let nextToastId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  show: (variant, message) =>
    set({ toast: { id: ++nextToastId, variant, message } }),
  hide: () => set({ toast: null }),
}));

export function showToast(variant: ToastVariant, message: string) {
  useToastStore.getState().show(variant, message);
}
