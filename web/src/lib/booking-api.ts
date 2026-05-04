import { apiClient } from './api-client';
import { withMockFallback } from './mock/fallback';
import { MOCK_BOOKINGS, findBooking } from './mock';

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

function buildMockBooking(payload: CreateBookingPayload, status: BookingStatus): Booking {
  const id = `bk-demo-${Date.now().toString(36)}`;
  const pricePerSeat = 1500000; // 15 000 XOF default
  const seats = payload.seats.map((s, i) => ({
    id: `bs-${id}-${i}`,
    seat_number: s.seat_number,
    first_name: s.first_name,
    last_name: s.last_name,
    category: s.category,
    price_cents:
      s.category === 'child'
        ? pricePerSeat * 0.5
        : s.category === 'senior'
          ? pricePerSeat * 0.8
          : s.category === 'student'
            ? pricePerSeat * 0.85
            : pricePerSeat,
  }));
  const total = Math.round(seats.reduce((acc, s) => acc + s.price_cents, 0));
  const now = new Date().toISOString();
  return {
    id,
    user_id: 'u-demo-traveler',
    trip_id: payload.trip_id,
    status,
    total_price_cents: total,
    currency: 'XOF',
    lock_expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
    confirmed_at: status === 'confirmed' ? now : null,
    cancelled_at: null,
    created_at: now,
    seats,
  };
}

export async function createBooking(
  payload: CreateBookingPayload,
  token: string,
  idempotencyKey: string,
): Promise<Booking> {
  return withMockFallback(
    async () => {
      const res = await apiClient<Booking>('/bookings/', {
        method: 'POST',
        body: payload,
        token,
        headers: authHeaders(token, idempotencyKey),
      });
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'booking failed');
      return res.data;
    },
    () => buildMockBooking(payload, 'pending_payment'),
  );
}

export async function getBooking(id: string, token: string): Promise<Booking> {
  return withMockFallback(
    async () => {
      const res = await apiClient<Booking>(`/bookings/${id}`, { token });
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'booking not found');
      return res.data;
    },
    () => {
      const mock = findBooking(id) ?? MOCK_BOOKINGS[0];
      if (!mock) throw new Error('booking not found in mocks');
      return mock;
    },
  );
}

export async function listBookings(token: string): Promise<ListBookingsResult> {
  return withMockFallback(
    async () => {
      const res = await apiClient<ListBookingsResult>('/bookings/', { token });
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'list bookings failed');
      return res.data;
    },
    () => ({
      bookings: MOCK_BOOKINGS,
      total: MOCK_BOOKINGS.length,
      limit: 20,
      offset: 0,
    }),
  );
}

export async function confirmBooking(id: string, token: string): Promise<Booking> {
  return withMockFallback(
    async () => {
      const res = await apiClient<Booking>(`/bookings/${id}/confirm`, {
        method: 'POST',
        token,
      });
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'confirm failed');
      return res.data;
    },
    () => {
      const existing = findBooking(id) ?? MOCK_BOOKINGS[0];
      return { ...existing, status: 'confirmed', confirmed_at: new Date().toISOString() };
    },
  );
}

export async function cancelBooking(id: string, token: string): Promise<Booking> {
  return withMockFallback(
    async () => {
      const res = await apiClient<Booking>(`/bookings/${id}/cancel`, {
        method: 'POST',
        token,
      });
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'cancel failed');
      return res.data;
    },
    () => {
      const existing = findBooking(id) ?? MOCK_BOOKINGS[0];
      return { ...existing, status: 'cancelled', cancelled_at: new Date().toISOString() };
    },
  );
}
