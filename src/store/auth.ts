import { create } from "zustand";
import type { User } from "@/types";

type AuthState = {
  token: string | null;
  user: User | null;
  setSession: (token: string, user: User) => void;
  logout: () => void;
  can: (permission: string) => boolean;
};

const stored = localStorage.getItem("vynq-session");
const initial = stored ? JSON.parse(stored) as Pick<AuthState, "token" | "user"> : { token: null, user: null };

export const useAuthStore = create<AuthState>((set, get) => ({
  token: initial.token,
  user: initial.user,
  setSession: (token, user) => {
    localStorage.setItem("vynq-session", JSON.stringify({ token, user }));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem("vynq-session");
    set({ token: null, user: null });
  },
  can: (permission) => {
    const user = get().user;
    if (!user) return false;
    return user.permissions.includes("*") || user.permissions.includes(permission) || user.permissions.includes(permission.split(":")[0]);
  }
}));
