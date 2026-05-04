import { apiClient } from './api-client';
import type { ApiResponse, User } from '@/types/shared';
import { UserRole } from '@/types/shared';
import { DEMO_USERS } from './mock/users';
import { DEMO_MODE, mockDelay } from './mock/fallback';

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

const DEMO_TOKEN_PREFIX = 'demo-token-';

function demoRoleToEnum(role: 'voyageur' | 'operateur' | 'admin'): UserRole {
  switch (role) {
    case 'operateur':
      return UserRole.OPERATEUR;
    case 'admin':
      return UserRole.ADMIN;
    case 'voyageur':
    default:
      return UserRole.VOYAGEUR;
  }
}

function findDemoUserByCredentials(
  email: string,
  password: string,
): (typeof DEMO_USERS)[number] | undefined {
  return DEMO_USERS.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase().trim() &&
      u.password === password,
  );
}

function findDemoUserByToken(token: string): (typeof DEMO_USERS)[number] | undefined {
  if (!token.startsWith(DEMO_TOKEN_PREFIX)) return undefined;
  const role = token.slice(DEMO_TOKEN_PREFIX.length) as 'voyageur' | 'operateur' | 'admin';
  return DEMO_USERS.find((u) => u.role === role);
}

function buildDemoTokenPair(role: 'voyageur' | 'operateur' | 'admin'): TokenPair {
  const now = Date.now();
  return {
    access_token: `${DEMO_TOKEN_PREFIX}${role}`,
    refresh_token: `${DEMO_TOKEN_PREFIX}refresh-${role}`,
    expires_at: new Date(now + 24 * 3600_000).toISOString(),
  };
}

function buildDemoUser(demo: (typeof DEMO_USERS)[number]): User {
  return {
    id: `u-demo-${demo.role}`,
    email: demo.email,
    phone: demo.phone,
    role: demoRoleToEnum(demo.role),
    twoFactorEnabled: false,
  };
}

function demoResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<ApiResponse<TokenPair>> => {
    // Try demo credentials first — lets demo accounts work even when backend is up
    const demo = findDemoUserByCredentials(payload.email, payload.password);
    if (demo) {
      await mockDelay();
      return demoResponse(buildDemoTokenPair(demo.role));
    }
    if (DEMO_MODE) {
      await mockDelay();
      return {
        success: false,
        error: { code: 'unauthorized', message: 'Identifiants invalides' },
      };
    }
    try {
      return await apiClient<TokenPair>('/users/login', {
        method: 'POST',
        body: payload,
      });
    } catch {
      return {
        success: false,
        error: { code: 'network', message: 'Backend indisponible — utilisez un compte de démo' },
      };
    }
  },

  login2FA: async (payload: Login2FAPayload): Promise<ApiResponse<TokenPair>> => {
    // Demo users have 2FA disabled, but if called we succeed instantly
    const demo = findDemoUserByCredentials(payload.email, payload.password);
    if (demo) {
      await mockDelay();
      return demoResponse(buildDemoTokenPair(demo.role));
    }
    return apiClient<TokenPair>('/users/login/2fa', { method: 'POST', body: payload });
  },

  register: async (payload: RegisterPayload): Promise<ApiResponse<User>> => {
    try {
      return await apiClient<User>('/users/register', { method: 'POST', body: payload });
    } catch {
      await mockDelay();
      return demoResponse({
        id: `u-demo-${Date.now().toString(36)}`,
        email: payload.email,
        phone: payload.phone,
        role: UserRole.VOYAGEUR,
        twoFactorEnabled: false,
      });
    }
  },

  refresh: async (refreshToken: string): Promise<ApiResponse<TokenPair>> => {
    if (refreshToken.startsWith(DEMO_TOKEN_PREFIX)) {
      const role = refreshToken.slice(
        (DEMO_TOKEN_PREFIX + 'refresh-').length,
      ) as 'voyageur' | 'operateur' | 'admin';
      return demoResponse(buildDemoTokenPair(role));
    }
    return apiClient<TokenPair>('/users/refresh', {
      method: 'POST',
      body: { refresh_token: refreshToken },
    });
  },

  getProfile: async (token: string): Promise<ApiResponse<User>> => {
    const demo = findDemoUserByToken(token);
    if (demo) {
      await mockDelay(120);
      return demoResponse(buildDemoUser(demo));
    }
    return apiClient<User>('/users/me', { token });
  },

  updateProfile: async (token: string, body: { phone?: string }): Promise<ApiResponse<User>> => {
    const demo = findDemoUserByToken(token);
    if (demo) {
      await mockDelay();
      const user = buildDemoUser(demo);
      return demoResponse({ ...user, phone: body.phone ?? user.phone });
    }
    try {
      return await apiClient<User>('/users/me', { method: 'PUT', body, token });
    } catch {
      return { success: false, error: { code: 'network', message: 'Network error' } };
    }
  },

  enable2FA: async (token: string): Promise<ApiResponse<Enable2FAResponse>> => {
    if (findDemoUserByToken(token)) {
      await mockDelay();
      return demoResponse({
        secret: 'JBSWY3DPEHPK3PXP',
        provisioning_uri: 'otpauth://totp/BusExpress:demo?secret=JBSWY3DPEHPK3PXP&issuer=BusExpress',
      });
    }
    return apiClient<Enable2FAResponse>('/users/me/2fa/enable', { method: 'POST', token });
  },

  verify2FA: async (token: string, code: string): Promise<ApiResponse<{ status: string }>> => {
    if (findDemoUserByToken(token)) {
      await mockDelay();
      return code.length === 6 ? demoResponse({ status: 'enabled' }) : { success: false, error: { code: 'invalid_code', message: 'Code invalide' } };
    }
    return apiClient<{ status: string }>('/users/me/2fa/verify', {
      method: 'POST',
      body: { code },
      token,
    });
  },

  listSessions: async (token: string): Promise<ApiResponse<Session[]>> => {
    if (findDemoUserByToken(token)) {
      await mockDelay();
      return demoResponse([
        {
          ID: 'sess-demo-current',
          UserID: 'u-demo',
          DeviceInfo: 'Chrome sur macOS · Cet appareil',
          IPAddress: '197.214.XX.XX (Abidjan)',
          CreatedAt: new Date(Date.now() - 2 * 86400_000).toISOString(),
          LastActiveAt: new Date().toISOString(),
        },
        {
          ID: 'sess-demo-2',
          UserID: 'u-demo',
          DeviceInfo: 'Safari sur iPhone',
          IPAddress: '197.214.XX.XX (Abidjan)',
          CreatedAt: new Date(Date.now() - 14 * 86400_000).toISOString(),
          LastActiveAt: new Date(Date.now() - 8 * 3600_000).toISOString(),
        },
      ]);
    }
    return apiClient<Session[]>('/users/me/sessions', { token });
  },

  revokeSession: async (token: string, sessionId: string): Promise<ApiResponse<{ status: string }>> => {
    if (findDemoUserByToken(token)) {
      await mockDelay();
      return demoResponse({ status: `revoked:${sessionId}` });
    }
    return apiClient<{ status: string }>(`/users/me/sessions/${sessionId}`, {
      method: 'DELETE',
      token,
    });
  },

  deleteAccount: async (token: string): Promise<ApiResponse<{ status: string }>> => {
    if (findDemoUserByToken(token)) {
      await mockDelay();
      return demoResponse({ status: 'scheduled_for_deletion' });
    }
    return apiClient<{ status: string }>('/users/me', { method: 'DELETE', token });
  },
};

function mockSavedPassengers(): SavedPassenger[] {
  // Import MOCK_PASSENGERS lazily to avoid circular deps at import time.
  // Since this is called at runtime, relying on the shared mock module is fine.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MOCK_PASSENGERS } = require('./mock/passengers') as {
    MOCK_PASSENGERS: ReadonlyArray<{
      id: string;
      firstName: string;
      lastName: string;
      dob: string;
      idNumber?: string;
    }>;
  };
  return MOCK_PASSENGERS.map((p) => ({
    id: p.id,
    first_name: p.firstName,
    last_name: p.lastName,
    date_of_birth: p.dob,
    document_number_masked: p.idNumber ? p.idNumber.slice(0, 3) + '•••' + p.idNumber.slice(-3) : undefined,
    created_at: new Date(Date.now() - 30 * 86400_000).toISOString(),
  }));
}

export const passengersApi = {
  list: async (token: string): Promise<ApiResponse<SavedPassenger[]>> => {
    if (findDemoUserByToken(token)) {
      await mockDelay();
      return demoResponse(mockSavedPassengers());
    }
    try {
      return await apiClient<SavedPassenger[]>('/users/me/passengers', { token });
    } catch {
      await mockDelay();
      return demoResponse(mockSavedPassengers());
    }
  },

  create: async (
    token: string,
    body: {
      first_name: string;
      last_name: string;
      date_of_birth?: string;
      document_number?: string;
    },
  ): Promise<ApiResponse<SavedPassenger>> => {
    if (findDemoUserByToken(token)) {
      await mockDelay();
      return demoResponse({
        id: `p-demo-${Date.now().toString(36)}`,
        first_name: body.first_name,
        last_name: body.last_name,
        date_of_birth: body.date_of_birth,
        document_number_masked: body.document_number
          ? body.document_number.slice(0, 3) + '•••' + body.document_number.slice(-3)
          : undefined,
        created_at: new Date().toISOString(),
      });
    }
    try {
      return await apiClient<SavedPassenger>('/users/me/passengers', {
        method: 'POST',
        body,
        token,
      });
    } catch {
      return { success: false, error: { code: 'network', message: 'Network error' } };
    }
  },

  update: async (
    token: string,
    id: string,
    body: {
      first_name: string;
      last_name: string;
      date_of_birth?: string;
      document_number?: string;
    },
  ): Promise<ApiResponse<SavedPassenger>> => {
    if (findDemoUserByToken(token)) {
      await mockDelay();
      return demoResponse({
        id,
        first_name: body.first_name,
        last_name: body.last_name,
        date_of_birth: body.date_of_birth,
        document_number_masked: body.document_number
          ? body.document_number.slice(0, 3) + '•••' + body.document_number.slice(-3)
          : undefined,
        created_at: new Date().toISOString(),
      });
    }
    try {
      return await apiClient<SavedPassenger>(`/users/me/passengers/${id}`, {
        method: 'PUT',
        body,
        token,
      });
    } catch {
      return { success: false, error: { code: 'network', message: 'Network error' } };
    }
  },

  delete: async (token: string, id: string): Promise<ApiResponse<{ status: string }>> => {
    if (findDemoUserByToken(token)) {
      await mockDelay();
      return demoResponse({ status: `deleted:${id}` });
    }
    try {
      return await apiClient<{ status: string }>(`/users/me/passengers/${id}`, {
        method: 'DELETE',
        token,
      });
    } catch {
      return { success: false, error: { code: 'network', message: 'Network error' } };
    }
  },
};
