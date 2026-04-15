import { apiClient } from './api-client';

export interface OperatorProfile {
  readonly id: string;
  readonly name: string;
  readonly contact_email?: string | null;
  readonly contact_phone?: string | null;
  readonly address?: string | null;
}

export type BusClass = 'standard' | 'vip' | 'sleeper';
export type BusStatus = 'active' | 'maintenance' | 'retired';

export interface Bus {
  readonly id: string;
  readonly license_plate: string;
  readonly model: string;
  readonly capacity: number;
  readonly class: BusClass;
  readonly amenities: ReadonlyArray<string>;
  readonly status: BusStatus;
  readonly updated_at: string;
}

export type DriverStatus = 'active' | 'on_leave' | 'suspended' | 'former';

export interface Driver {
  readonly id: string;
  readonly first_name: string;
  readonly last_name: string;
  readonly license_number: string;
  readonly phone?: string | null;
  readonly license_expires_at: string;
  readonly status: DriverStatus;
}

export interface ListResult<T> {
  readonly items: ReadonlyArray<T>;
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
}

export interface CancellationPolicy {
  readonly refund_pct_24h: number;
  readonly refund_pct_2_to_24h: number;
  readonly refund_pct_under_2h: number;
  readonly updated_at: string;
}

export interface BaggagePolicy {
  readonly free_kg: number;
  readonly extra_fee_per_kg_cents: number;
  readonly max_kg_per_passenger: number;
  readonly updated_at: string;
}

async function call<T>(
  endpoint: string,
  token: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await apiClient<T>(endpoint, { ...init, token });
  if (!res.success || res.data === undefined) {
    throw new Error(res.error?.message ?? 'request failed');
  }
  return res.data as T;
}

export const operatorApi = {
  getProfile: (token: string, defaultName?: string) =>
    call<OperatorProfile>(
      `/operator/profile${defaultName ? `?default_name=${encodeURIComponent(defaultName)}` : ''}`,
      token,
    ),
  updateProfile: (token: string, patch: Partial<OperatorProfile>) =>
    call<OperatorProfile>('/operator/profile', token, { method: 'PUT', body: patch }),

  listBuses: (token: string) => call<ListResult<Bus>>('/operator/buses', token),
  createBus: (token: string, body: Omit<Bus, 'id' | 'status' | 'updated_at'>) =>
    call<Bus>('/operator/buses', token, { method: 'POST', body }),
  updateBus: (token: string, id: string, body: Partial<Bus>) =>
    call<Bus>(`/operator/buses/${id}`, token, { method: 'PUT', body }),
  deleteBus: (token: string, id: string) =>
    call<{ status: string }>(`/operator/buses/${id}`, token, { method: 'DELETE' }),

  listDrivers: (token: string) => call<ListResult<Driver>>('/operator/drivers', token),
  createDriver: (token: string, body: Omit<Driver, 'id' | 'status'>) =>
    call<Driver>('/operator/drivers', token, { method: 'POST', body }),
  updateDriver: (token: string, id: string, body: Partial<Driver>) =>
    call<Driver>(`/operator/drivers/${id}`, token, { method: 'PUT', body }),
  deleteDriver: (token: string, id: string) =>
    call<{ status: string }>(`/operator/drivers/${id}`, token, { method: 'DELETE' }),

  getCancellationPolicy: (token: string) =>
    call<CancellationPolicy>('/operator/policies/cancellation', token),
  updateCancellationPolicy: (
    token: string,
    body: Omit<CancellationPolicy, 'updated_at'>,
  ) =>
    call<CancellationPolicy>('/operator/policies/cancellation', token, {
      method: 'PUT',
      body,
    }),

  getBaggagePolicy: (token: string) => call<BaggagePolicy>('/operator/policies/baggage', token),
  updateBaggagePolicy: (token: string, body: Omit<BaggagePolicy, 'updated_at'>) =>
    call<BaggagePolicy>('/operator/policies/baggage', token, { method: 'PUT', body }),
};
