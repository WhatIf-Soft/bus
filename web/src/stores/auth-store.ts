import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types/shared';

interface AuthState {
  readonly user: User | null;
  readonly accessToken: string | null;
  readonly refreshToken: string | null;
  readonly expiresAt: string | null;
  /** True once zustand-persist has rehydrated from localStorage. */
  readonly hasHydrated: boolean;
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
  readonly setHasHydrated: (v: boolean) => void;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  hasHydrated: false,
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

      clear: () => set({ ...initialState, hasHydrated: true }),

      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: 'busexpress-auth',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      // Persist access token + refresh token + user.
      // Access tokens have server-side expiry; if expired at next session,
      // the refresh flow (or demo-mode re-hydration) handles it. This lets
      // demo accounts survive page reloads during a demo session.
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
      }),
    },
  ),
);

export function useIsAuthenticated(): boolean {
  return useAuthStore((state) => state.accessToken !== null);
}
