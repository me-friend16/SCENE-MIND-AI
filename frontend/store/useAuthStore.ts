import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      setToken: (token) => {
        set({ token });
        // Write a lightweight cookie so Next.js middleware can detect auth
        if (typeof document !== 'undefined') {
          document.cookie = `sm_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        }
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        if (typeof document !== 'undefined') {
          document.cookie = 'sm_token=; path=/; max-age=0';
        }
      },
    }),
    {
      name: 'scenemind-auth',
      partialize: (s) => ({ user: s.user, token: s.token }),
    },
  ),
);
