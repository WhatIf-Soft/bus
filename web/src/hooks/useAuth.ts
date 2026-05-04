'use client';

import { useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { authApi, type LoginPayload, type Login2FAPayload, type RegisterPayload } from '@/lib/auth-api';

export class TwoFactorRequiredError extends Error {
  constructor() {
    super('two_factor_required');
    this.name = 'TwoFactorRequiredError';
  }
}

export function useAuth() {
  const store = useAuthStore();

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await authApi.login(payload);
    if (!res.success) {
      if (res.error?.code === 'unauthorized' && res.error.message.includes('two-factor')) {
        throw new TwoFactorRequiredError();
      }
      throw new Error(res.error?.message ?? 'login failed');
    }
    if (!res.data) throw new Error('empty response');

    store.setTokens(res.data.access_token, res.data.refresh_token, res.data.expires_at);

    // Fetch profile
    const profile = await authApi.getProfile(res.data.access_token);
    if (profile.success && profile.data) {
      store.setUser(profile.data);
    }
  }, [store]);

  const login2FA = useCallback(async (payload: Login2FAPayload) => {
    const res = await authApi.login2FA(payload);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message ?? '2fa login failed');
    }
    store.setTokens(res.data.access_token, res.data.refresh_token, res.data.expires_at);

    const profile = await authApi.getProfile(res.data.access_token);
    if (profile.success && profile.data) {
      store.setUser(profile.data);
    }
  }, [store]);

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await authApi.register(payload);
    if (!res.success) {
      throw new Error(res.error?.message ?? 'register failed');
    }
  }, []);

  const logout = useCallback(() => {
    store.clear();
  }, [store]);

  return {
    user: store.user,
    accessToken: store.accessToken,
    isAuthenticated: store.accessToken !== null,
    hasHydrated: store.hasHydrated,
    login,
    login2FA,
    register,
    logout,
  };
}
