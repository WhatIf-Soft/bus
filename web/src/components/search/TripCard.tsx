import Link from 'next/link';
import type { Trip } from '@/lib/search-api';
import { Button } from '@/components/ui/Button';

interface TripCardProps {
  readonly trip: Trip;
  readonly locale: string;
  readonly passengers?: number;
  readonly onJoinWaitlist?: (tripId: string) => void;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

function formatPrice(cents: number, currency: string): string {
  const value = cents / 100;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function TripCard({ trip, locale, passengers = 1, onJoinWaitlist }: TripCardProps) {
  const soldOut = trip.available_seats < passengers;
  return (
    <article className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-black/5 bg-[var(--color-surface)] p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-semibold tracking-tight">
            {formatTime(trip.departure_time)}
          </span>
          <span className="text-sm text-[var(--color-text-muted)]">
            → {formatTime(trip.arrival_time)}
          </span>
          <span className="rounded bg-black/5 px-2 py-0.5 text-xs">
            {formatDuration(trip.duration_minutes)}
          </span>
        </div>
        <div className="mt-1 text-sm text-[var(--color-text-muted)]">
          {trip.origin.city} → {trip.destination.city}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium">{trip.operator.name}</span>
          <span aria-label="rating" className="text-amber-500">
            ★ {trip.operator.rating.toFixed(1)}
          </span>
          <span className="rounded bg-[var(--color-primary)]/10 px-2 py-0.5 uppercase text-[var(--color-primary)]">
            {trip.bus_class}
          </span>
          {trip.amenities.slice(0, 3).map((a) => (
            <span key={a} className="rounded bg-black/5 px-2 py-0.5">
              {a}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="text-right">
          <div className="text-xl font-semibold">
            {formatPrice(trip.price_cents, trip.currency)}
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">
            {trip.available_seats} siège(s) disponibles
          </div>
        </div>
        {soldOut ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onJoinWaitlist?.(trip.id)}
          >
            Liste d'attente
          </Button>
        ) : (
          <Button asChild size="sm">
            <Link href={`/${locale}/booking/${trip.id}`}>Réserver</Link>
          </Button>
        )}
      </div>
    </article>
  );
}
