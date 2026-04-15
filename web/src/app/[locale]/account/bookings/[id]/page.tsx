'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cancelBooking, getBooking, type Booking } from '@/lib/booking-api';
import {
  downloadTicketPdf,
  issueTickets,
  listTicketsForBooking,
  type Ticket,
} from '@/lib/ticket-api';
import { Button } from '@/components/ui/Button';

interface PageProps {
  readonly params: Promise<{ locale: string; id: string }>;
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function BookingDetailPage({ params }: PageProps) {
  const { locale, id } = use(params);
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [tickets, setTickets] = useState<ReadonlyArray<Ticket>>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/${locale}/login?next=/${locale}/account/bookings/${id}`);
      return;
    }
    if (!accessToken) return;
    getBooking(id, accessToken)
      .then(setBooking)
      .catch((e) => setError(e instanceof Error ? e.message : 'erreur'));
    listTicketsForBooking(id, accessToken).then(setTickets).catch(() => {});
  }, [accessToken, isAuthenticated, id, locale, router]);

  async function onIssue(): Promise<void> {
    if (!accessToken) return;
    setSubmitting(true);
    setError(null);
    try {
      const issued = await issueTickets(id, accessToken);
      setTickets(issued);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erreur');
    } finally {
      setSubmitting(false);
    }
  }

  async function onCancel(): Promise<void> {
    if (!accessToken || !booking) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await cancelBooking(booking.id, accessToken);
      setBooking(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erreur');
    } finally {
      setSubmitting(false);
    }
  }

  if (!booking) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        {error ? (
          <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        ) : (
          <p>Chargement…</p>
        )}
      </main>
    );
  }

  const cancellable =
    booking.status === 'pending_seat' ||
    booking.status === 'pending_payment' ||
    booking.status === 'confirmed';

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Réservation</h1>
        <span className="rounded bg-black/5 px-2 py-0.5 text-xs">{booking.status}</span>
      </header>

      <div className="rounded-md border border-black/10 p-4">
        <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
          <dt className="text-[var(--color-text-muted)]">ID</dt>
          <dd className="text-right font-mono text-xs">{booking.id}</dd>
          <dt className="text-[var(--color-text-muted)]">Trip ID</dt>
          <dd className="text-right font-mono text-xs">{booking.trip_id}</dd>
          <dt className="text-[var(--color-text-muted)]">Créée le</dt>
          <dd className="text-right">
            {new Date(booking.created_at).toLocaleString('fr-FR')}
          </dd>
          {booking.confirmed_at && (
            <>
              <dt className="text-[var(--color-text-muted)]">Confirmée le</dt>
              <dd className="text-right">
                {new Date(booking.confirmed_at).toLocaleString('fr-FR')}
              </dd>
            </>
          )}
          {booking.cancelled_at && (
            <>
              <dt className="text-[var(--color-text-muted)]">Annulée le</dt>
              <dd className="text-right">
                {new Date(booking.cancelled_at).toLocaleString('fr-FR')}
              </dd>
            </>
          )}
        </dl>
      </div>

      <div className="rounded-md border border-black/10 p-4">
        <h2 className="text-lg font-semibold">Passagers</h2>
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {booking.seats.map((s) => (
            <li key={s.id} className="flex justify-between">
              <span>
                {s.seat_number} · {s.first_name} {s.last_name}{' '}
                <span className="text-[var(--color-text-muted)]">({s.category})</span>
              </span>
              <span>{formatPrice(s.price_cents, booking.currency)}</span>
            </li>
          ))}
        </ul>
        <hr className="my-3 border-black/10" />
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatPrice(booking.total_price_cents, booking.currency)}</span>
        </div>
      </div>

      <div className="rounded-md border border-black/10 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Billets</h2>
          {booking.status === 'confirmed' && tickets.length === 0 && (
            <Button size="sm" onClick={onIssue} disabled={submitting}>
              {submitting ? 'Émission…' : 'Émettre les billets'}
            </Button>
          )}
        </div>
        {tickets.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {booking.status === 'confirmed'
              ? 'Aucun billet émis pour le moment.'
              : 'Les billets seront disponibles une fois la réservation confirmée.'}
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2 text-sm">
            {tickets.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded border border-black/5 p-2"
              >
                <div>
                  <div className="font-medium">
                    Siège {t.seat_number} · {t.passenger_name}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    Statut : <code>{t.status}</code> · valide jusqu’au{' '}
                    {new Date(t.expires_at).toLocaleString('fr-FR')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!accessToken) return;
                    try {
                      await downloadTicketPdf(t.id, accessToken);
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'PDF erreur');
                    }
                  }}
                  className="rounded border border-[var(--color-primary)] px-3 py-1 text-xs text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white"
                >
                  PDF
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {cancellable && (
        <div className="flex justify-end">
          <Button variant="destructive" onClick={onCancel} disabled={submitting}>
            {submitting ? 'Annulation…' : 'Annuler la réservation'}
          </Button>
        </div>
      )}
    </main>
  );
}
