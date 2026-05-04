import { apiClient } from './api-client';
import { withMockFallback } from './mock/fallback';
import {
  MOCK_BUSES,
  MOCK_DRIVERS,
  MOCK_OPERATOR_PROFILE,
  MOCK_CANCELLATION_POLICY,
  MOCK_BAGGAGE_POLICY,
} from './mock';

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

function listBusesMock(): ListResult<Bus> {
  return { items: MOCK_BUSES as ReadonlyArray<Bus>, total: MOCK_BUSES.length, limit: 50, offset: 0 };
}

function listDriversMock(): ListResult<Driver> {
  return { items: MOCK_DRIVERS as ReadonlyArray<Driver>, total: MOCK_DRIVERS.length, limit: 50, offset: 0 };
}

export const operatorApi = {
  getProfile: (token: string, defaultName?: string) =>
    withMockFallback(
      () =>
        call<OperatorProfile>(
          `/operator/profile${defaultName ? `?default_name=${encodeURIComponent(defaultName)}` : ''}`,
          token,
        ),
      () => ({
        ...MOCK_OPERATOR_PROFILE,
        name: defaultName ?? MOCK_OPERATOR_PROFILE.name,
      }),
    ),
  updateProfile: (token: string, patch: Partial<OperatorProfile>) =>
    withMockFallback(
      () => call<OperatorProfile>('/operator/profile', token, { method: 'PUT', body: patch }),
      () => ({ ...MOCK_OPERATOR_PROFILE, ...patch }),
    ),

  listBuses: (token: string) =>
    withMockFallback(() => call<ListResult<Bus>>('/operator/buses', token), listBusesMock),
  createBus: (token: string, body: Omit<Bus, 'id' | 'status' | 'updated_at'>) =>
    withMockFallback(
      () => call<Bus>('/operator/buses', token, { method: 'POST', body }),
      () => ({
        id: `b-demo-${Date.now().toString(36)}`,
        license_plate: body.license_plate,
        model: body.model,
        capacity: body.capacity,
        class: body.class,
        amenities: body.amenities,
        status: 'active' as BusStatus,
        updated_at: new Date().toISOString(),
      }),
    ),
  updateBus: (token: string, id: string, body: Partial<Bus>) =>
    withMockFallback(
      () => call<Bus>(`/operator/buses/${id}`, token, { method: 'PUT', body }),
      () => {
        const base = MOCK_BUSES.find((b) => b.id === id) ?? MOCK_BUSES[0];
        return {
          ...(base as Bus),
          ...body,
          updated_at: new Date().toISOString(),
        };
      },
    ),
  deleteBus: (token: string, id: string) =>
    withMockFallback(
      () => call<{ status: string }>(`/operator/buses/${id}`, token, { method: 'DELETE' }),
      () => ({ status: `deleted:${id}` }),
    ),

  listDrivers: (token: string) =>
    withMockFallback(() => call<ListResult<Driver>>('/operator/drivers', token), listDriversMock),
  createDriver: (token: string, body: Omit<Driver, 'id' | 'status'>) =>
    withMockFallback(
      () => call<Driver>('/operator/drivers', token, { method: 'POST', body }),
      () => ({
        id: `d-demo-${Date.now().toString(36)}`,
        first_name: body.first_name,
        last_name: body.last_name,
        license_number: body.license_number,
        phone: body.phone ?? null,
        license_expires_at: body.license_expires_at,
        status: 'active' as DriverStatus,
      }),
    ),
  updateDriver: (token: string, id: string, body: Partial<Driver>) =>
    withMockFallback(
      () => call<Driver>(`/operator/drivers/${id}`, token, { method: 'PUT', body }),
      () => {
        const base = MOCK_DRIVERS.find((d) => d.id === id) ?? MOCK_DRIVERS[0];
        return { ...(base as Driver), ...body };
      },
    ),
  deleteDriver: (token: string, id: string) =>
    withMockFallback(
      () => call<{ status: string }>(`/operator/drivers/${id}`, token, { method: 'DELETE' }),
      () => ({ status: `deleted:${id}` }),
    ),

  getCancellationPolicy: (token: string) =>
    withMockFallback(
      () => call<CancellationPolicy>('/operator/policies/cancellation', token),
      () => MOCK_CANCELLATION_POLICY,
    ),
  updateCancellationPolicy: (
    token: string,
    body: Omit<CancellationPolicy, 'updated_at'>,
  ) =>
    withMockFallback(
      () =>
        call<CancellationPolicy>('/operator/policies/cancellation', token, {
          method: 'PUT',
          body,
        }),
      () => ({ ...body, updated_at: new Date().toISOString() }),
    ),

  getBaggagePolicy: (token: string) =>
    withMockFallback(
      () => call<BaggagePolicy>('/operator/policies/baggage', token),
      () => MOCK_BAGGAGE_POLICY,
    ),
  updateBaggagePolicy: (token: string, body: Omit<BaggagePolicy, 'updated_at'>) =>
    withMockFallback(
      () => call<BaggagePolicy>('/operator/policies/baggage', token, { method: 'PUT', body }),
      () => ({ ...body, updated_at: new Date().toISOString() }),
    ),
};
