import Link from 'next/link';
import type { Trip } from '@/lib/search-api';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
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

function seatBadgeVariant(count: number): 'success' | 'warning' | 'error' {
  if (count >= 10) return 'success';
  if (count >= 2) return 'warning';
  return 'error';
}

function BusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 text-[var(--color-text-muted)]"
      aria-hidden="true"
    >
      <rect x="3" y="1" width="10" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <rect x="4.5" y="3" width="7" height="4" rx="1" stroke="currentColor" strokeWidth="1" />
      <circle cx="5.5" cy="11" r="1" fill="currentColor" />
      <circle cx="10.5" cy="11" r="1" fill="currentColor" />
      <line x1="3" y1="14" x2="5" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="11" y1="14" x2="13" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function TripCard({ trip, locale, passengers = 1, onJoinWaitlist }: TripCardProps) {
  const soldOut = trip.available_seats < passengers;

  return (
    <article className="rounded-[var(--radius-lg)] border border-black/5 bg-[var(--color-surface-elevated)] p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        {/* Left — Times + Duration */}
        <div className="flex shrink-0 flex-col gap-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">
              {formatTime(trip.departure_time)}
            </span>
            <span className="text-sm text-[var(--color-text-muted)]">
              → {formatTime(trip.arrival_time)}
            </span>
          </div>
          <Badge variant="default">{formatDuration(trip.duration_minutes)}</Badge>
        </div>

        {/* Center — Route + Operator + Amenities */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {/* Route line */}
          <div className="flex items-center gap-0 text-sm font-medium">
            <span className="shrink-0">{trip.origin.city}</span>
            <span className="mx-2 flex-1 border-t border-dashed border-black/20" />
            <BusIcon />
            <span className="mx-2 flex-1 border-t border-dashed border-black/20" />
            <span className="shrink-0">{trip.destination.city}</span>
          </div>

          {/* Operator row */}
          <div className="flex items-center gap-2">
            <Avatar size="sm" name={trip.operator.name} />
            <span className="text-sm font-medium">{trip.operator.name}</span>
            <span className="text-[var(--color-accent-gold)]" aria-label={`Note ${trip.operator.rating.toFixed(1)}`}>
              ★ {trip.operator.rating.toFixed(1)}
            </span>
          </div>

          {/* Amenities */}
          {trip.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {trip.amenities.slice(0, 3).map((amenity) => (
                <Badge key={amenity} variant="default">
                  {amenity}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Right — Price + Seats + CTA */}
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <span className="text-xl font-bold text-[var(--color-accent-gold)]">
            {formatPrice(trip.price_cents, trip.currency)}
          </span>
          <Badge variant={seatBadgeVariant(trip.available_seats)}>
            {trip.available_seats} sièges
          </Badge>
          {soldOut ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onJoinWaitlist?.(trip.id)}
            >
              Liste d&apos;attente
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link href={`/${locale}/booking/${trip.id}`}>Réserver</Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
