import { Suspense } from 'react';
import Link from 'next/link';
import { SearchForm } from '@/components/search/SearchForm';
import { TripCard } from '@/components/search/TripCard';
import { SkeletonTripCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { searchTrips, type Trip } from '@/lib/search-api';

export const dynamic = 'force-dynamic';

interface SearchPageProps {
  readonly params: Promise<{ locale: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type SortOption = 'recommended' | 'price' | 'duration' | 'departure';

const SORT_LABELS: Record<SortOption, string> = {
  recommended: 'Recommandé',
  price: 'Prix',
  duration: 'Durée',
  departure: 'Départ',
};

const SORT_OPTIONS: ReadonlyArray<SortOption> = ['recommended', 'price', 'duration', 'departure'];

function pickString(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? '';
  return v ?? '';
}

function SearchIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function LoadingFallback() {
  return (
    <div className="flex flex-col gap-3">
      <SkeletonTripCard />
      <SkeletonTripCard />
      <SkeletonTripCard />
    </div>
  );
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
  sort: SortOption;
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
      <div role="alert" className="rounded-[var(--radius-lg)] bg-[var(--color-error)]/10 p-4 text-[var(--color-error)]">
        {errorMsg}
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <EmptyState
        icon={<SearchIcon />}
        heading="Aucun trajet trouvé"
        description="Essayez une date différente ou consultez les correspondances"
        action={
          <Button asChild variant="secondary">
            <Link href={`/${locale}/search`}>Nouvelle recherche</Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      {/* Result count + sort pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-2 text-[var(--text-small)] text-[var(--color-text-muted)]">
          {total} trajet(s) trouvé(s)
        </span>
        {SORT_OPTIONS.map((s) => {
          const qs = new URLSearchParams({
            origin,
            destination,
            date,
            passengers: String(passengers),
            sort: s,
          });
          return (
            <a
              key={s}
              href={`/${locale}/search?${qs.toString()}`}
              className={
                s === sort
                  ? 'rounded-[var(--radius-full)] bg-[var(--color-accent-warm)] px-3 py-1 text-[var(--text-xs)] font-medium text-white transition-colors'
                  : 'rounded-[var(--radius-full)] border border-black/10 px-3 py-1 text-[var(--text-xs)] font-medium text-[var(--color-text-muted)] transition-colors hover:border-black/20'
              }
            >
              {SORT_LABELS[s]}
            </a>
          );
        })}
      </div>

      {/* Trip list */}
      <div className="flex flex-col gap-3">
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} locale={locale} passengers={passengers} />
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
  const sort: SortOption = (SORT_OPTIONS as ReadonlyArray<string>).includes(sortRaw)
    ? (sortRaw as SortOption)
    : 'recommended';

  const hasQuery = origin !== '' && destination !== '';

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-4">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-[var(--text-small)] text-[var(--color-text-muted)]">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href={`/${locale}`} className="hover:text-[var(--color-text)] transition-colors">
              Accueil
            </Link>
          </li>
          <li aria-hidden="true">&gt;</li>
          <li>
            <Link href={`/${locale}/search`} className="hover:text-[var(--color-text)] transition-colors">
              Recherche
            </Link>
          </li>
          {hasQuery && (
            <>
              <li aria-hidden="true">&gt;</li>
              <li aria-current="page" className="font-medium text-[var(--color-text)]">
                {origin} → {destination}
              </li>
            </>
          )}
        </ol>
      </nav>

      {/* Search form */}
      <SearchForm
        defaultOrigin={origin}
        defaultDestination={destination}
        defaultDate={date}
        defaultPassengers={passengers}
        locale={locale}
      />

      {/* Results */}
      {hasQuery && (
        <section className="flex flex-col gap-4" aria-label="Résultats de recherche">
          <Suspense fallback={<LoadingFallback />}>
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
