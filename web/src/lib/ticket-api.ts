import { apiClient } from './api-client';
import { withMockFallback } from './mock/fallback';
import { MOCK_BOOKINGS } from './mock';

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

function mockTicketsForBooking(bookingId: string): ReadonlyArray<Ticket> {
  const booking = MOCK_BOOKINGS.find((b) => b.id === bookingId) ?? MOCK_BOOKINGS[0];
  if (!booking) return [];
  return booking.seats.map((seat, i) => ({
    id: `tkt-${booking.id}-${i}`,
    booking_id: booking.id,
    user_id: booking.user_id,
    trip_id: booking.trip_id,
    seat_number: seat.seat_number,
    passenger_name: `${seat.first_name} ${seat.last_name}`,
    status: booking.status === 'used' ? 'used' : booking.status === 'cancelled' || booking.status === 'refunded' ? 'cancelled' : 'issued',
    qr: `BEX|${booking.id}|${seat.seat_number}|${booking.trip_id}`,
    issued_at: booking.confirmed_at ?? booking.created_at,
    used_at: booking.status === 'used' ? booking.confirmed_at : null,
    expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
  }));
}

export async function issueTickets(bookingId: string, token: string): Promise<ReadonlyArray<Ticket>> {
  return withMockFallback(
    async () => {
      const res = await apiClient<IssueTicketsResponse>('/tickets/', {
        method: 'POST',
        body: { booking_id: bookingId },
        token,
      });
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'failed to issue tickets');
      return res.data.tickets;
    },
    () => mockTicketsForBooking(bookingId),
  );
}

export async function listTicketsForBooking(
  bookingId: string,
  token: string,
): Promise<ReadonlyArray<Ticket>> {
  return withMockFallback(
    async () => {
      const res = await apiClient<IssueTicketsResponse>(
        `/tickets/?booking_id=${encodeURIComponent(bookingId)}`,
        { token },
      );
      if (!res.success || !res.data) return [];
      return res.data.tickets;
    },
    () => mockTicketsForBooking(bookingId),
  );
}

export function ticketPdfUrl(ticketId: string): string {
  return `/api/v1/tickets/${ticketId}/pdf`;
}

// downloadTicketPdf fetches the PDF with the bearer token, opens it in a new tab.
// Falls back to a minimal inline PDF-like view when the backend isn't available.
export async function downloadTicketPdf(ticketId: string, token: string): Promise<void> {
  try {
    const res = await fetch(ticketPdfUrl(ticketId), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`PDF unavailable (HTTP ${res.status})`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch {
    // Demo fallback — open a data-URL HTML page styled as a ticket.
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Billet ${ticketId}</title>
      <style>body{font-family:Georgia,serif;background:#F7F3E8;color:#1F2A68;padding:48px;max-width:640px;margin:auto}
      h1{font-size:42px;margin:0 0 16px}.box{background:#fff;padding:32px;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.08)}
      .label{text-transform:uppercase;letter-spacing:.2em;font-size:10px;color:#8B7A5C;margin-top:16px}
      .qr{margin:32px auto;width:200px;height:200px;background:repeating-linear-gradient(45deg,#1F2A68 0 4px,#fff 4px 8px);border-radius:8px}</style></head>
      <body><div class="box"><p class="label" style="margin-top:0">La Route Dorée</p>
      <h1>Billet BusExpress</h1><p>Référence : <strong>${ticketId}</strong></p>
      <p class="label">QR Code</p><div class="qr"></div>
      <p>Mode démo — PDF non généré par le backend.</p></div></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}

export interface ValidateResult {
  readonly id: string;
  readonly seat_number: string;
  readonly passenger_name: string;
  readonly status: TicketStatus;
}

export async function validateQR(qr: string): Promise<ValidateResult> {
  return withMockFallback(
    async () => {
      const res = await apiClient<ValidateResult>('/tickets/validate', {
        method: 'POST',
        body: { qr },
      });
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'invalid ticket');
      return res.data;
    },
    () => {
      // Parse QR payload: BEX|<booking>|<seat>|<trip>
      const parts = qr.split('|');
      return {
        id: `tkt-${parts[1] ?? 'unknown'}`,
        seat_number: parts[2] ?? 'A-01',
        passenger_name: 'Zégué Kurt',
        status: 'issued',
      };
    },
  );
}
