'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalIcon, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';

interface ScheduledTrip {
  readonly id: string;
  readonly routeLabel: string;
  readonly departureTime: string;
  readonly duration: string;
  readonly busPlate: string;
  readonly driver: string;
  readonly capacity: number;
  readonly booked: number;
  readonly status: 'scheduled' | 'published' | 'full' | 'cancelled';
}

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const MOCK_TRIPS: Record<number, ReadonlyArray<ScheduledTrip>> = {
  0: [
    { id: 't-1', routeLabel: 'Abidjan → Ouagadougou', departureTime: '07:00', duration: '16h', busPlate: 'CI-8842 AB', driver: 'K. Touré', capacity: 50, booked: 37, status: 'published' },
    { id: 't-2', routeLabel: 'Abidjan → Yamoussoukro', departureTime: '09:30', duration: '3h30', busPlate: 'CI-2211 XY', driver: 'M. Ouattara', capacity: 50, booked: 50, status: 'full' },
  ],
  1: [
    { id: 't-3', routeLabel: 'Abidjan → Accra', departureTime: '06:00', duration: '10h', busPlate: 'CI-5566 CD', driver: 'S. Diallo', capacity: 38, booked: 21, status: 'published' },
  ],
  2: [
    { id: 't-4', routeLabel: 'Abidjan → Ouagadougou', departureTime: '19:00', duration: '16h', busPlate: 'CI-8842 AB', driver: 'K. Touré', capacity: 50, booked: 12, status: 'published' },
    { id: 't-5', routeLabel: 'Abidjan → Yamoussoukro', departureTime: '12:00', duration: '3h30', busPlate: 'CI-4499 EF', driver: 'A. Koné', capacity: 50, booked: 0, status: 'scheduled' },
  ],
  3: [
    { id: 't-6', routeLabel: 'Abidjan → Accra', departureTime: '06:00', duration: '10h', busPlate: 'CI-5566 CD', driver: 'S. Diallo', capacity: 38, booked: 30, status: 'published' },
  ],
  4: [],
  5: [
    { id: 't-7', routeLabel: 'Abidjan → Ouagadougou', departureTime: '07:00', duration: '16h', busPlate: 'CI-8842 AB', driver: 'K. Touré', capacity: 50, booked: 45, status: 'published' },
  ],
  6: [],
};

const STATUS_STYLE: Record<ScheduledTrip['status'], string> = {
  scheduled:
    'bg-[var(--color-warning)]/15 text-[var(--color-warning)] ring-[var(--color-warning)]/30',
  published: 'bg-[var(--color-success)]/10 text-[var(--color-success)] ring-[var(--color-success)]/20',
  full: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] ring-[var(--color-primary)]/20',
  cancelled: 'bg-[var(--color-error)]/10 text-[var(--color-error)] ring-[var(--color-error)]/20',
};

const STATUS_LABEL: Record<ScheduledTrip['status'], string> = {
  scheduled: 'Brouillon',
  published: 'Publié',
  full: 'Complet',
  cancelled: 'Annulé',
};

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // convert so Mon=0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function OperatorSchedulesPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [weekStart],
  );

  function shiftWeek(deltaDays: number): void {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + deltaDays);
    setWeekStart(next);
  }

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="display text-2xl font-medium tracking-tight">Horaires</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Semaine du {formatDate(weekStart)} au {formatDate(weekEnd)} — planifiez et publiez vos
            départs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftWeek(-7)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent-warm-ink)] hover:text-[var(--color-accent-warm-ink)]"
            aria-label="Semaine précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="rounded-[var(--radius-full)] border border-black/10 bg-white px-3 py-1.5 text-[length:var(--text-xs)] font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-accent-warm-ink)]/40"
          >
            Aujourd&apos;hui
          </button>
          <button
            type="button"
            onClick={() => shiftWeek(7)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent-warm-ink)] hover:text-[var(--color-accent-warm-ink)]"
            aria-label="Semaine suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <Button className="ml-2 gap-2">
            <Plus className="h-4 w-4" />
            Nouveau départ
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-7">
        {days.map((d, i) => {
          const trips = MOCK_TRIPS[i] ?? [];
          const isToday = d.toDateString() === new Date().toDateString();
          return (
            <div
              key={i}
              className={cn(
                'flex flex-col gap-2 rounded-[var(--radius-lg)] border border-black/5 bg-[var(--color-surface-elevated)] p-3',
                isToday && 'ring-2 ring-[var(--color-accent-warm)]/40',
              )}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
                  {DAY_LABELS[i]}
                </span>
                <span className="display text-xl font-medium tabular-nums text-[var(--color-text)]">
                  {d.getDate()}
                </span>
              </div>
              {trips.length === 0 ? (
                <p className="mt-1 rounded-[var(--radius-md)] border border-dashed border-black/10 px-2 py-3 text-center text-[10px] text-[var(--color-text-muted)]/70">
                  Aucun départ
                </p>
              ) : (
                trips.map((t) => (
                  <TripCell key={t.id} trip={t} />
                ))
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-[var(--radius-lg)] border border-black/5 bg-[var(--color-bg)] p-4 text-xs text-[var(--color-text-muted)]">
        <CalIcon className="mr-1.5 inline h-3.5 w-3.5 -translate-y-0.5" />
        Astuce : un départ passe automatiquement au statut &quot;Complet&quot; dès que le dernier
        siège est vendu. Vous pouvez le dupliquer pour ouvrir un second car.
      </div>
    </section>
  );
}

function TripCell({ trip }: { readonly trip: ScheduledTrip }) {
  const fillPct = Math.round((trip.booked / trip.capacity) * 100);
  return (
    <button
      type="button"
      className="group flex flex-col gap-1.5 rounded-[var(--radius-md)] border border-black/5 bg-[var(--color-bg)] p-2.5 text-left transition-colors hover:border-[var(--color-accent-warm-ink)]/30"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="display text-base font-medium tabular-nums">
          {trip.departureTime}
        </span>
        <Badge
          variant="default"
          className={cn('text-[9px] font-semibold uppercase', STATUS_STYLE[trip.status])}
        >
          {STATUS_LABEL[trip.status]}
        </Badge>
      </div>
      <p className="truncate text-[11px] leading-tight text-[var(--color-text)]">
        {trip.routeLabel}
      </p>
      <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-muted)]">
        <Clock className="h-3 w-3" />
        <span>{trip.duration}</span>
      </div>
      <div className="mt-1">
        <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span className="tabular-nums">{trip.booked}/{trip.capacity}</span>
          </span>
          <span className="tabular-nums">{fillPct}%</span>
        </div>
        <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-black/5">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              fillPct >= 100
                ? 'bg-[var(--color-primary)]'
                : fillPct >= 80
                  ? 'bg-[var(--color-accent-warm-ink)]'
                  : 'bg-[var(--color-success)]',
            )}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>
    </button>
  );
}
