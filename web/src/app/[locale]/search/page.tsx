import { Suspense } from 'react';
import { SearchForm } from '@/components/search/SearchForm';
import { TripCard } from '@/components/search/TripCard';
import { searchTrips, type Trip } from '@/lib/search-api';

export const dynamic = 'force-dynamic';

interface SearchPageProps {
  readonly params: Promise<{ locale: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pickString(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? '';
  return v ?? '';
}

async function SearchResults({
  origin,
  destination,
  date,
  passengers,
  sort,
  locale,
}: {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
  sort: 'recommended' | 'price' | 'duration' | 'departure';
  locale: string;
}) {
  let trips: ReadonlyArray<Trip> = [];
  let total = 0;
  let errorMsg: string | null = null;

  try {
    const result = await searchTrips({ origin, destination, date, passengers, sort });
    trips = result.trips;
    total = result.total;
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : 'Search error';
  }

  if (errorMsg) {
    return (
      <div role="alert" className="rounded bg-red-50 p-4 text-red-800">
        {errorMsg}
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <p className="rounded bg-black/5 p-4 text-center">
        Aucun trajet trouvé pour {origin} → {destination} le {date}.
      </p>
    );
  }

  return (
    <>
      <p className="text-sm text-[var(--color-text-muted)]">{total} trajet(s) trouvé(s)</p>
      <div className="flex flex-col gap-3">
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} locale={locale} />
        ))}
      </div>
    </>
  );
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const origin = pickString(sp.origin);
  const destination = pickString(sp.destination);
  const date = pickString(sp.date) || new Date().toISOString().slice(0, 10);
  const passengers = Math.max(1, Number(pickString(sp.passengers) || '1'));
  const sortRaw = pickString(sp.sort);
  const sort = (['recommended', 'price', 'duration', 'departure'].includes(sortRaw)
    ? sortRaw
    : 'recommended') as 'recommended' | 'price' | 'duration' | 'departure';

  const hasQuery = origin !== '' && destination !== '';

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-4">
      <h1 className="text-3xl font-semibold tracking-tight">Rechercher un trajet</h1>

      <SearchForm
        defaultOrigin={origin}
        defaultDestination={destination}
        defaultDate={date}
        defaultPassengers={passengers}
        locale={locale}
      />

      {hasQuery && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-[var(--color-text-muted)]">Trier par:</span>
            {(['recommended', 'price', 'duration', 'departure'] as const).map((s) => {
              const qs = new URLSearchParams({
                origin,
                destination,
                date,
                passengers: String(passengers),
                sort: s,
              });
              const label =
                s === 'recommended'
                  ? 'Recommandé'
                  : s === 'price'
                    ? 'Prix'
                    : s === 'duration'
                      ? 'Durée'
                      : 'Départ';
              return (
                <a
                  key={s}
                  href={`/${locale}/search?${qs.toString()}`}
                  className={`rounded border px-2 py-1 ${
                    s === sort
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                      : 'border-black/10'
                  }`}
                >
                  {label}
                </a>
              );
            })}
          </div>
          <Suspense fallback={<p>Chargement…</p>}>
            <SearchResults
              origin={origin}
              destination={destination}
              date={date}
              passengers={passengers}
              sort={sort}
              locale={locale}
            />
          </Suspense>
        </section>
      )}
    </main>
  );
}
