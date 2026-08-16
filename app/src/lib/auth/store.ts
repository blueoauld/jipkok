import { create } from "zustand";

type AuthStatus = "unknown" | "authenticated" | "unauthenticated";

type AuthState = {
  status: AuthStatus;
  signin: () => void;
  signout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: "unknown",
  signin: () => set({ status: "authenticated" }),
  signout: () => set({ status: "unauthenticated" }),
}));
