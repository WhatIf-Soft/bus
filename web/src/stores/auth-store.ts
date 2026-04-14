import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@busexpress/shared-types';

interface AuthState {
  readonly user: User | null;
  readonly accessToken: string | null;
  readonly refreshToken: string | null;
  readonly expiresAt: string | null;
}

interface AuthActions {
  readonly setSession: (
    user: User | null,
    accessToken: string,
    refreshToken: string,
    expiresAt: string,
  ) => void;
  readonly setUser: (user: User) => void;
  readonly setTokens: (
    accessToken: string,
    refreshToken: string,
    expiresAt: string,
  ) => void;
  readonly clear: () => void;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      ...initialState,

      setSession: (user, accessToken, refreshToken, expiresAt) =>
        set({ user, accessToken, refreshToken, expiresAt }),

      setUser: (user) => set({ user }),

      setTokens: (accessToken, refreshToken, expiresAt) =>
        set({ accessToken, refreshToken, expiresAt }),

      clear: () => set(initialState),
    }),
    {
      name: 'busexpress-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist refresh token + user — access token should be re-issued on each session
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);

export function useIsAuthenticated(): boolean {
  return useAuthStore((state) => state.accessToken !== null);
}
