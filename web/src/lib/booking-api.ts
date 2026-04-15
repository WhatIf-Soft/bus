import { apiClient } from './api-client';

export type BookingStatus =
  | 'pending_seat'
  | 'pending_payment'
  | 'confirmed'
  | 'cancelled'
  | 'expired'
  | 'failed'
  | 'refunded'
  | 'used'
  | 'disputed'
  | 'partially_cancelled'
  | 'partially_refunded';

export type PassengerCategory = 'adult' | 'child' | 'senior' | 'student';

export interface BookingSeat {
  readonly id: string;
  readonly seat_number: string;
  readonly first_name: string;
  readonly last_name: string;
  readonly category: PassengerCategory;
  readonly price_cents: number;
}

export interface Booking {
  readonly id: string;
  readonly user_id: string;
  readonly trip_id: string;
  readonly status: BookingStatus;
  readonly total_price_cents: number;
  readonly currency: string;
  readonly lock_expires_at: string;
  readonly confirmed_at?: string | null;
  readonly cancelled_at?: string | null;
  readonly created_at: string;
  readonly seats: ReadonlyArray<BookingSeat>;
}

export interface ListBookingsResult {
  readonly bookings: ReadonlyArray<Booking>;
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
}

export interface PassengerInput {
  readonly seat_number: string;
  readonly first_name: string;
  readonly last_name: string;
  readonly category: PassengerCategory;
}

export interface CreateBookingPayload {
  readonly trip_id: string;
  readonly seats: ReadonlyArray<PassengerInput>;
}

function authHeaders(token: string, idempotencyKey?: string): Record<string, string> {
  const h: Record<string, string> = {};
  if (idempotencyKey) h['Idempotency-Key'] = idempotencyKey;
  return h;
}

export async function createBooking(
  payload: CreateBookingPayload,
  token: string,
  idempotencyKey: string,
): Promise<Booking> {
  const res = await apiClient<Booking>('/bookings/', {
    method: 'POST',
    body: payload,
    token,
    headers: authHeaders(token, idempotencyKey),
  });
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? 'booking failed');
  }
  return res.data;
}

export async function getBooking(id: string, token: string): Promise<Booking> {
  const res = await apiClient<Booking>(`/bookings/${id}`, { token });
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? 'booking not found');
  }
  return res.data;
}

export async function listBookings(token: string): Promise<ListBookingsResult> {
  const res = await apiClient<ListBookingsResult>('/bookings/', { token });
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? 'list bookings failed');
  }
  return res.data;
}

export async function confirmBooking(id: string, token: string): Promise<Booking> {
  const res = await apiClient<Booking>(`/bookings/${id}/confirm`, {
    method: 'POST',
    token,
  });
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? 'confirm failed');
  }
  return res.data;
}

export async function cancelBooking(id: string, token: string): Promise<Booking> {
  const res = await apiClient<Booking>(`/bookings/${id}/cancel`, {
    method: 'POST',
    token,
  });
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? 'cancel failed');
  }
  return res.data;
}
