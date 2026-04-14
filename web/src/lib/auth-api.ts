import { apiClient } from './api-client';
import type { User } from '@busexpress/shared-types';

export interface TokenPair {
  readonly access_token: string;
  readonly refresh_token: string;
  readonly expires_at: string;
}

export interface LoginPayload {
  readonly email: string;
  readonly password: string;
}

export interface Login2FAPayload extends LoginPayload {
  readonly code: string;
}

export interface RegisterPayload {
  readonly email: string;
  readonly password: string;
  readonly phone?: string;
}

export interface Enable2FAResponse {
  readonly secret: string;
  readonly provisioning_uri: string;
}

export interface Session {
  readonly ID: string;
  readonly UserID: string;
  readonly DeviceInfo: string;
  readonly IPAddress: string;
  readonly CreatedAt: string;
  readonly LastActiveAt: string;
  readonly RevokedAt?: string;
}

export interface SavedPassenger {
  readonly id: string;
  readonly first_name: string;
  readonly last_name: string;
  readonly date_of_birth?: string;
  readonly document_number_masked?: string;
  readonly created_at: string;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient<TokenPair>('/users/login', { method: 'POST', body: payload }),

  login2FA: (payload: Login2FAPayload) =>
    apiClient<TokenPair>('/users/login/2fa', { method: 'POST', body: payload }),

  register: (payload: RegisterPayload) =>
    apiClient<User>('/users/register', { method: 'POST', body: payload }),

  refresh: (refreshToken: string) =>
    apiClient<TokenPair>('/users/refresh', {
      method: 'POST',
      body: { refresh_token: refreshToken },
    }),

  getProfile: (token: string) =>
    apiClient<User>('/users/me', { token }),

  updateProfile: (token: string, body: { phone?: string }) =>
    apiClient<User>('/users/me', { method: 'PUT', body, token }),

  enable2FA: (token: string) =>
    apiClient<Enable2FAResponse>('/users/me/2fa/enable', {
      method: 'POST',
      token,
    }),

  verify2FA: (token: string, code: string) =>
    apiClient<{ status: string }>('/users/me/2fa/verify', {
      method: 'POST',
      body: { code },
      token,
    }),

  listSessions: (token: string) =>
    apiClient<Session[]>('/users/me/sessions', { token }),

  revokeSession: (token: string, sessionId: string) =>
    apiClient<{ status: string }>(`/users/me/sessions/${sessionId}`, {
      method: 'DELETE',
      token,
    }),

  deleteAccount: (token: string) =>
    apiClient<{ status: string }>('/users/me', { method: 'DELETE', token }),
};

export const passengersApi = {
  list: (token: string) =>
    apiClient<SavedPassenger[]>('/users/me/passengers', { token }),

  create: (
    token: string,
    body: {
      first_name: string;
      last_name: string;
      date_of_birth?: string;
      document_number?: string;
    },
  ) =>
    apiClient<SavedPassenger>('/users/me/passengers', {
      method: 'POST',
      body,
      token,
    }),

  update: (
    token: string,
    id: string,
    body: {
      first_name: string;
      last_name: string;
      date_of_birth?: string;
      document_number?: string;
    },
  ) =>
    apiClient<SavedPassenger>(`/users/me/passengers/${id}`, {
      method: 'PUT',
      body,
      token,
    }),

  delete: (token: string, id: string) =>
    apiClient<{ status: string }>(`/users/me/passengers/${id}`, {
      method: 'DELETE',
      token,
    }),
};
