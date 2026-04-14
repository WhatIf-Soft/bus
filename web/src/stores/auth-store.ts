import { create } from 'zustand';
import type { User } from '@busexpress/shared-types';

type AuthState = {
  readonly user: User | null;
  readonly accessToken: string | null;
  readonly refreshToken: string | null;
};

type AuthActions = {
  readonly login: (user: User, accessToken: string, refreshToken: string) => void;
  readonly logout: () => void;
  readonly setTokens: (accessToken: string, refreshToken: string) => void;
  readonly isAuthenticated: () => boolean;
};

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
};

export const useAuthStore = create<AuthState & AuthActions>()((set, get) => ({
  ...initialState,

  login: (user, accessToken, refreshToken) =>
    set({ user, accessToken, refreshToken }),

  logout: () => set(initialState),

  setTokens: (accessToken, refreshToken) =>
    set({ accessToken, refreshToken }),

  isAuthenticated: () => get().accessToken !== null && get().user !== null,
}));
