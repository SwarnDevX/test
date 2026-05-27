import { create } from "zustand";

interface AuthState {
  isLoggingOut: boolean;
  setLoggingOut: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggingOut: false,
  setLoggingOut: (v) => set({ isLoggingOut: v }),
}));
