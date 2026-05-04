'use client';

import { useState } from 'react';
import { Download, Filter, Users, Clock, Bus, Search, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';

interface ManifestRow {
  readonly id: string;
  readonly route: string;
  readonly departureDate: string;
  readonly departureTime: string;
  readonly busPlate: string;
  readonly driver: string;
  readonly capacity: number;
  readonly booked: number;
  readonly boarded: number;
  readonly status: 'upcoming' | 'boarding' | 'in_transit' | 'arrived';
}

const MOCK_MANIFESTS: ReadonlyArray<ManifestRow> = [
  {
    id: 'm-1',
    route: 'Abidjan → Ouagadougou',
    departureDate: '2026-04-18',
    departureTime: '07:00',
    busPlate: 'CI-8842 AB',
    driver: 'K. Touré',
    capacity: 50,
    booked: 47,
    boarded: 34,
    status: 'boarding',
  },
  {
    id: 'm-2',
    route: 'Abidjan → Yamoussoukro',
    departureDate: '2026-04-18',
    departureTime: '09:30',
    busPlate: 'CI-2211 XY',
    driver: 'M. Ouattara',
    capacity: 50,
    booked: 50,
    boarded: 0,
    status: 'upcoming',
  },
  {
    id: 'm-3',
    route: 'Abidjan → Accra',
    departureDate: '2026-04-18',
    departureTime: '06:00',
    busPlate: 'CI-5566 CD',
    driver: 'S. Diallo',
    capacity: 38,
    booked: 30,
    boarded: 30,
    status: 'in_transit',
  },
  {
    id: 'm-4',
    route: 'Abidjan → Bamako',
    departureDate: '2026-04-17',
    departureTime: '19:00',
    busPlate: 'CI-7733 ZZ',
    driver: 'A. Koné',
    capacity: 50,
    booked: 42,
    boarded: 42,
    status: 'arrived',
  },
];

const STATUS_STYLE: Record<ManifestRow['status'], string> = {
  upcoming:
    'bg-black/5 text-[var(--color-text-muted)] ring-black/10',
  boarding:
    'bg-[var(--color-warning)]/15 text-[var(--color-warning)] ring-[var(--color-warning)]/30',
  in_transit:
    'bg-[var(--color-accent-warm)]/15 text-[var(--color-accent-warm-ink)] ring-[var(--color-accent-warm)]/30',
  arrived: 'bg-[var(--color-success)]/10 text-[var(--color-success)] ring-[var(--color-success)]/20',
};

const STATUS_LABEL: Record<ManifestRow['status'], string> = {
  upcoming: 'À venir',
  boarding: 'Embarquement',
  in_transit: 'En route',
  arrived: 'Arrivé',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export default function OperatorManifestsPage() {
  const [filter, setFilter] = useState<'all' | ManifestRow['status']>('all');
  const [query, setQuery] = useState('');

  const filtered = MOCK_MANIFESTS.filter((m) => {
    if (filter !== 'all' && m.status !== filter) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      return m.route.toLowerCase().includes(q) || m.busPlate.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="display text-2xl font-medium tracking-tight">Manifestes</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Listes passagers par trajet. Téléchargeables en PDF et accessibles hors-ligne pour les
            conducteurs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="relative block w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Ligne ou immatriculation"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 w-full rounded-[var(--radius-lg)] border border-black/10 bg-white pl-9 pr-3 text-sm outline-none transition-colors focus:border-[var(--color-accent-warm-ink)]/50 focus:ring-2 focus:ring-[var(--color-accent-warm)]/20"
            />
          </label>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Filter className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
        {(['all', 'upcoming', 'boarding', 'in_transit', 'arrived'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-[var(--radius-full)] px-3 py-1 font-medium transition-colors',
              filter === f
                ? 'bg-[var(--color-accent-warm-ink)] text-white'
                : 'border border-black/10 text-[var(--color-text-muted)] hover:border-black/20',
            )}
          >
            {f === 'all' ? 'Tous' : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <li className="rounded-[var(--radius-lg)] border border-dashed border-black/10 p-8 text-center text-sm text-[var(--color-text-muted)]">
            Aucun manifeste pour ces critères.
          </li>
        ) : (
          filtered.map((m, i) => {
            const fillPct = Math.round((m.booked / m.capacity) * 100);
            const boardedPct = m.booked === 0 ? 0 : Math.round((m.boarded / m.booked) * 100);
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => toast.info('Ouverture du manifeste complet')}
                  className="card-hover animate-entrance group flex w-full flex-col gap-3 rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-5 text-left shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary)]/5 ring-1 ring-[var(--color-primary)]/10">
                      <Bus className="h-5 w-5 text-[var(--color-primary)]" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="default" className={cn('text-[10px] font-semibold', STATUS_STYLE[m.status])}>
                          {STATUS_LABEL[m.status]}
                        </Badge>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {formatDate(m.departureDate)} · {m.departureTime}
                        </span>
                      </div>
                      <h3 className="mt-1 text-base font-semibold">{m.route}</h3>
                      <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                        Car <span className="font-mono">{m.busPlate}</span> · chauffeur {m.driver}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 sm:justify-end">
                    <div>
                      <p className="display text-2xl font-medium tabular-nums text-[var(--color-text)]">
                        {m.booked}
                        <span className="ml-0.5 text-sm font-normal text-[var(--color-text-muted)]">
                          /{m.capacity}
                        </span>
                      </p>
                      <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                        <Users className="h-3 w-3" />
                        Réservés
                      </p>
                    </div>

                    <div className="hidden sm:block">
                      <p className="display text-2xl font-medium tabular-nums text-[var(--color-accent-warm-ink)]">
                        {boardedPct}%
                      </p>
                      <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                        <Clock className="h-3 w-3" />
                        Embarqués
                      </p>
                    </div>

                    <span
                      role="button"
                      tabIndex={-1}
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.success('Manifeste exporté en PDF');
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent-warm-ink)]/40 hover:text-[var(--color-accent-warm-ink)]"
                      aria-label="Télécharger en PDF"
                    >
                      <Download className="h-4 w-4" />
                    </span>

                    <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
