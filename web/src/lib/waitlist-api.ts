import { apiClient } from './api-client';

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
  const res = await apiClient<WaitlistEntry>('/waitlist/', {
    method: 'POST',
    body: { trip_id: tripId, seats_requested: seatsRequested },
    token,
  });
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? 'join waitlist failed');
  }
  return res.data;
}

export async function listMyWaitlist(token: string): Promise<ListEntriesResult> {
  const res = await apiClient<ListEntriesResult>('/waitlist/mine', { token });
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? 'list waitlist failed');
  }
  return res.data;
}

export async function cancelWaitlistEntry(id: string, token: string): Promise<WaitlistEntry> {
  const res = await apiClient<WaitlistEntry>(`/waitlist/${id}/cancel`, {
    method: 'POST',
    token,
  });
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? 'cancel failed');
  }
  return res.data;
}
