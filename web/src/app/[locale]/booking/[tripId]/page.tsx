import { notFound } from 'next/navigation';
import { getTrip } from '@/lib/search-api';
import { BookingFlow } from './BookingFlow';

export const dynamic = 'force-dynamic';

interface BookingPageProps {
  readonly params: Promise<{ locale: string; tripId: string }>;
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { locale, tripId } = await params;
  let trip;
  try {
    trip = await getTrip(tripId);
  } catch {
    notFound();
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Réservation</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          {trip.origin.city} → {trip.destination.city} · {trip.operator.name}
        </p>
      </header>
      <BookingFlow trip={trip} locale={locale} />
    </main>
  );
}
