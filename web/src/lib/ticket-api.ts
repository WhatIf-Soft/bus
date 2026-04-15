import { apiClient } from './api-client';

export type TicketStatus = 'issued' | 'used' | 'cancelled' | 'expired';

export interface Ticket {
  readonly id: string;
  readonly booking_id: string;
  readonly user_id: string;
  readonly trip_id: string;
  readonly seat_number: string;
  readonly passenger_name: string;
  readonly status: TicketStatus;
  readonly qr: string;
  readonly issued_at: string;
  readonly used_at?: string | null;
  readonly expires_at: string;
}

export interface IssueTicketsResponse {
  readonly tickets: ReadonlyArray<Ticket>;
}

export async function issueTickets(bookingId: string, token: string): Promise<ReadonlyArray<Ticket>> {
  const res = await apiClient<IssueTicketsResponse>('/tickets/', {
    method: 'POST',
    body: { booking_id: bookingId },
    token,
  });
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? 'failed to issue tickets');
  }
  return res.data.tickets;
}

export async function listTicketsForBooking(
  bookingId: string,
  token: string,
): Promise<ReadonlyArray<Ticket>> {
  const res = await apiClient<IssueTicketsResponse>(
    `/tickets/?booking_id=${encodeURIComponent(bookingId)}`,
    { token },
  );
  if (!res.success || !res.data) return [];
  return res.data.tickets;
}

export function ticketPdfUrl(ticketId: string): string {
  return `/api/v1/tickets/${ticketId}/pdf`;
}

// downloadTicketPdf fetches the PDF with the bearer token, opens it in a new tab.
export async function downloadTicketPdf(ticketId: string, token: string): Promise<void> {
  const res = await fetch(ticketPdfUrl(ticketId), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`PDF unavailable (HTTP ${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  // Revoke after a delay to give the new tab time to load.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export interface ValidateResult {
  readonly id: string;
  readonly seat_number: string;
  readonly passenger_name: string;
  readonly status: TicketStatus;
}

export async function validateQR(qr: string): Promise<ValidateResult> {
  const res = await apiClient<ValidateResult>('/tickets/validate', {
    method: 'POST',
    body: { qr },
  });
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? 'invalid ticket');
  }
  return res.data;
}
