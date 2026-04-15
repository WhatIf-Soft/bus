'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { listBookings, type Booking } from '@/lib/booking-api';

interface PageProps {
  readonly params: Promise<{ locale: string }>;
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function statusBadge(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-900';
    case 'pending_payment':
    case 'pending_seat':
      return 'bg-amber-100 text-amber-900';
    case 'cancelled':
    case 'expired':
    case 'failed':
      return 'bg-red-100 text-red-900';
    default:
      return 'bg-black/5';
  }
}

export default function AccountBookingsPage({ params }: PageProps) {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAuth();
  const [locale, setLocale] = useState('fr');
  const [bookings, setBookings] = useState<ReadonlyArray<Booking>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void params.then((p) => setLocale(p.locale));
  }, [params]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/${locale}/login?next=/${locale}/account/bookings`);
      return;
    }
    if (!accessToken) return;
    setLoading(true);
    listBookings(accessToken)
      .then((res) => setBookings(res.bookings))
      .catch((e) => setError(e instanceof Error ? e.message : 'erreur'))
      .finally(() => setLoading(false));
  }, [accessToken, isAuthenticated, router, locale]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold tracking-tight">Mes réservations</h1>
      {loading && <p>Chargement…</p>}
      {error && (
        <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}
      {!loading && bookings.length === 0 && (
        <p className="rounded bg-black/5 p-4 text-center">Aucune réservation pour le moment.</p>
      )}
      <ul className="flex flex-col gap-2">
        {bookings.map((b) => (
          <li key={b.id}>
            <Link
              href={`/${locale}/account/bookings/${b.id}`}
              className="flex items-center justify-between rounded border border-black/10 p-3 hover:border-[var(--color-primary)]"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[var(--color-text-muted)]">
                    #{b.id.slice(0, 8)}
                  </span>
                  <span className={`rounded px-2 py-0.5 text-xs ${statusBadge(b.status)}`}>
                    {b.status}
                  </span>
                </div>
                <div className="mt-1 text-sm">
                  {b.seats.length} siège(s) · {new Date(b.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
              <div className="font-semibold">
                {formatPrice(b.total_price_cents, b.currency)}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
