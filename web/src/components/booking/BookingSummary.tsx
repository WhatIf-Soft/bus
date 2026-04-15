import type { Trip } from '@/lib/search-api';
import type { Booking } from '@/lib/booking-api';

interface BookingSummaryProps {
  readonly trip: Trip;
  readonly booking: Booking;
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function BookingSummary({ trip, booking }: BookingSummaryProps) {
  return (
    <div className="rounded-md border border-black/10 p-4">
      <h3 className="text-lg font-semibold">Récapitulatif</h3>
      <dl className="mt-3 grid grid-cols-2 gap-y-1.5 text-sm">
        <dt className="text-[var(--color-text-muted)]">Trajet</dt>
        <dd className="text-right">
          {trip.origin.city} → {trip.destination.city}
        </dd>
        <dt className="text-[var(--color-text-muted)]">Départ</dt>
        <dd className="text-right">{formatDateTime(trip.departure_time)}</dd>
        <dt className="text-[var(--color-text-muted)]">Opérateur</dt>
        <dd className="text-right">{trip.operator.name}</dd>
        <dt className="text-[var(--color-text-muted)]">Sièges</dt>
        <dd className="text-right">
          {booking.seats.map((s) => s.seat_number).join(', ')}
        </dd>
      </dl>
      <hr className="my-3 border-black/10" />
      <div className="flex flex-col gap-1 text-sm">
        {booking.seats.map((s) => (
          <div key={s.id} className="flex justify-between">
            <span>
              {s.seat_number} · {s.first_name} {s.last_name}{' '}
              <span className="text-[var(--color-text-muted)]">({s.category})</span>
            </span>
            <span>{formatPrice(s.price_cents, booking.currency)}</span>
          </div>
        ))}
      </div>
      <hr className="my-3 border-black/10" />
      <div className="flex justify-between text-base font-semibold">
        <span>Total</span>
        <span>{formatPrice(booking.total_price_cents, booking.currency)}</span>
      </div>
    </div>
  );
}
