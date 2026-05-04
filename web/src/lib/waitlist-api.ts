import { apiClient } from './api-client';
import { withMockFallback } from './mock/fallback';
import { MOCK_WAITLIST } from './mock';

export type WaitlistStatus = 'queued' | 'notified' | 'expired' | 'cancelled' | 'fulfilled';

export interface WaitlistEntry {
  readonly id: string;
  readonly user_id: string;
  readonly trip_id: string;
  readonly seats_requested: number;
  readonly status: WaitlistStatus;
  readonly notified_at?: string | null;
  readonly confirm_deadline?: string | null;
  readonly fulfilled_booking_id?: string | null;
  readonly cancelled_at?: string | null;
  readonly created_at: string;
}

export interface ListEntriesResult {
  readonly entries: ReadonlyArray<WaitlistEntry>;
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
}

export async function joinWaitlist(
  tripId: string,
  seatsRequested: number,
  token: string,
): Promise<WaitlistEntry> {
  return withMockFallback(
    async () => {
      const res = await apiClient<WaitlistEntry>('/waitlist/', {
        method: 'POST',
        body: { trip_id: tripId, seats_requested: seatsRequested },
        token,
      });
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'join waitlist failed');
      return res.data;
    },
    () => ({
      id: `wl-demo-${Date.now().toString(36)}`,
      user_id: 'u-demo-traveler',
      trip_id: tripId,
      seats_requested: seatsRequested,
      status: 'queued',
      notified_at: null,
      confirm_deadline: new Date(Date.now() + 4 * 3600_000).toISOString(),
      fulfilled_booking_id: null,
      cancelled_at: null,
      created_at: new Date().toISOString(),
    }),
  );
}

export async function listMyWaitlist(token: string): Promise<ListEntriesResult> {
  return withMockFallback(
    async () => {
      const res = await apiClient<ListEntriesResult>('/waitlist/mine', { token });
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'list waitlist failed');
      return res.data;
    },
    () => {
      const entries: WaitlistEntry[] = MOCK_WAITLIST.map((e) => ({
        id: e.id,
        user_id: 'u-demo-traveler',
        trip_id: e.trip_id,
        seats_requested: e.seats_requested,
        status: e.status === 'waiting' ? 'queued' : e.status === 'offered' ? 'notified' : e.status === 'confirmed' ? 'fulfilled' : 'expired',
        notified_at: e.status === 'offered' ? new Date().toISOString() : null,
        confirm_deadline: e.expires_at,
        fulfilled_booking_id: null,
        cancelled_at: null,
        created_at: e.joined_at,
      }));
      return { entries, total: entries.length, limit: 20, offset: 0 };
    },
  );
}

export async function cancelWaitlistEntry(id: string, token: string): Promise<WaitlistEntry> {
  return withMockFallback(
    async () => {
      const res = await apiClient<WaitlistEntry>(`/waitlist/${id}/cancel`, {
        method: 'POST',
        token,
      });
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'cancel failed');
      return res.data;
    },
    () => ({
      id,
      user_id: 'u-demo-traveler',
      trip_id: 't-demo',
      seats_requested: 1,
      status: 'cancelled',
      notified_at: null,
      confirm_deadline: null,
      fulfilled_booking_id: null,
      cancelled_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 3 * 86400_000).toISOString(),
    }),
  );
}
