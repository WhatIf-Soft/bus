'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bus, Calendar, ArrowRight, Ticket, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { listBookings, type Booking } from '@/lib/booking-api';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/tabs';
import { Badge } from '@/components/shadcn/badge';
import { cn } from '@/lib/cn';

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

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  confirmed: {
    label: 'Confirmé',
    className: 'bg-[var(--color-success)]/10 text-[var(--color-success)] ring-[var(--color-success)]/20',
  },
  pending_payment: {
    label: 'Paiement en attente',
    className: 'bg-[var(--color-warning)]/15 text-[var(--color-warning)] ring-[var(--color-warning)]/30',
  },
  pending_seat: {
    label: 'Sièges en attente',
    className: 'bg-[var(--color-warning)]/15 text-[var(--color-warning)] ring-[var(--color-warning)]/30',
  },
  cancelled: {
    label: 'Annulé',
    className: 'bg-[var(--color-error)]/10 text-[var(--color-error)] ring-[var(--color-error)]/20',
  },
  expired: {
    label: 'Expiré',
    className: 'bg-[var(--color-error)]/10 text-[var(--color-error)] ring-[var(--color-error)]/20',
  },
  failed: {
    label: 'Échoué',
    className: 'bg-[var(--color-error)]/10 text-[var(--color-error)] ring-[var(--color-error)]/20',
  },
};

function getStatusConfig(status: string): { label: string; className: string } {
  return STATUS_CONFIG[status] ?? {
    label: status,
    className: 'bg-black/5 text-[var(--color-text-muted)] ring-black/10',
  };
}

export default function AccountBookingsPage({ params }: PageProps) {
  const router = useRouter();
  const { accessToken, isAuthenticated, hasHydrated } = useAuth();
  const [locale, setLocale] = useState('fr');
  const [bookings, setBookings] = useState<ReadonlyArray<Booking>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    void params.then((p) => setLocale(p.locale));
  }, [params]);

  useEffect(() => {
    if (!hasHydrated) return;
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
  }, [accessToken, isAuthenticated, hasHydrated, router, locale]);

  const filtered = useMemo(
    () =>
      query.trim()
        ? bookings.filter((b) => b.id.toLowerCase().includes(query.trim().toLowerCase()))
        : bookings,
    [bookings, query],
  );

  const upcoming = useMemo(
    () => filtered.filter((b) => b.status === 'confirmed' || b.status === 'pending_payment' || b.status === 'pending_seat'),
    [filtered],
  );
  const past = useMemo(
    () => filtered.filter((b) => b.status === 'used'),
    [filtered],
  );
  const cancelled = useMemo(
    () => filtered.filter((b) => b.status === 'cancelled' || b.status === 'expired' || b.status === 'failed' || b.status === 'refunded'),
    [filtered],
  );

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="display text-4xl font-medium tracking-tight">Mes réservations</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Retrouvez tous vos trajets passés et à venir
          </p>
        </div>
        <label className="relative block w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Rechercher par référence"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-[var(--radius-lg)] border border-black/10 bg-white pl-9 pr-3 text-sm outline-none transition-colors focus:border-[var(--color-accent-warm)] focus:ring-2 focus:ring-[var(--color-accent-warm)]/20"
          />
        </label>
      </header>

      {loading && (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="skeleton h-32 w-full rounded-[var(--radius-xl)]"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-[var(--radius-lg)] bg-[var(--color-error)]/10 p-4 text-sm text-[var(--color-error)]"
        >
          {error}
        </p>
      )}

      {!loading && filtered.length === 0 && (
        <EmptyState locale={locale} />
      )}

      {!loading && filtered.length > 0 && (
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="upcoming">
              À venir
              <span className="ml-1.5 text-xs opacity-60">({upcoming.length})</span>
            </TabsTrigger>
            <TabsTrigger value="past">
              Passés
              <span className="ml-1.5 text-xs opacity-60">({past.length})</span>
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Annulés
              <span className="ml-1.5 text-xs opacity-60">({cancelled.length})</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-4">
            <BookingsList bookings={upcoming} locale={locale} />
          </TabsContent>
          <TabsContent value="past" className="mt-4">
            <BookingsList bookings={past} locale={locale} />
          </TabsContent>
          <TabsContent value="cancelled" className="mt-4">
            <BookingsList bookings={cancelled} locale={locale} />
          </TabsContent>
        </Tabs>
      )}
    </main>
  );
}

function EmptyState({ locale }: { locale: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[var(--radius-xl)] border border-dashed border-black/10 bg-[var(--color-surface-elevated)] p-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent-warm)]/15">
        <Ticket className="h-8 w-8 text-[var(--color-accent-warm-ink)]" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">Aucune réservation</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Commencez par rechercher un trajet
        </p>
      </div>
      <Button asChild>
        <Link href={`/${locale}/search`}>Rechercher un trajet</Link>
      </Button>
    </div>
  );
}

function BookingsList({
  bookings,
  locale,
}: {
  bookings: ReadonlyArray<Booking>;
  locale: string;
}) {
  if (bookings.length === 0) {
    return (
      <p className="rounded-[var(--radius-lg)] border border-dashed border-black/10 p-8 text-center text-sm text-[var(--color-text-muted)]">
        Aucune réservation dans cette catégorie.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {bookings.map((b, i) => {
        const statusCfg = getStatusConfig(b.status);
        return (
          <li key={b.id}>
            <Link
              href={`/${locale}/account/bookings/${b.id}`}
              className="card-hover animate-entrance group flex flex-col gap-4 rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary)]/5 ring-1 ring-[var(--color-primary)]/10">
                  <Bus className="h-6 w-6 text-[var(--color-primary)]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[var(--color-text-muted)]">
                      #{b.id.slice(0, 8).toUpperCase()}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn('text-xs font-medium', statusCfg.className)}
                    >
                      {statusCfg.label}
                    </Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-[var(--color-text)]">
                    <span className="flex items-center gap-1.5">
                      <Ticket className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                      {b.seats.length} siège{b.seats.length > 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(b.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <div className="text-right">
                  <p className="text-lg font-bold text-[var(--color-accent-gold-ink)]">
                    {formatPrice(b.total_price_cents, b.currency)}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">Total</p>
                </div>
                <ArrowRight className="h-5 w-5 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--color-accent-warm)]" />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
