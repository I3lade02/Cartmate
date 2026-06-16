import { create } from "zustand";
import type { AppUser } from "../types/user";

type AuthState = {
    user: AppUser | null;
    isLoading: boolean;
    setUser: (user: AppUser | null) => void;
    setIsLoading: (isLoading: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    setUser: (user) => set({ user }),
    setIsLoading: (isLoading) => set({ isLoading }),
}));