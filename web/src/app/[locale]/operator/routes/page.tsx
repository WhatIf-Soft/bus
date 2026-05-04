'use client';

import { useState } from 'react';
import { ArrowRight, MapPin, Plus, Clock, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';

interface Stop {
  readonly city: string;
  readonly country: string;
  readonly arrivalOffsetMin: number;
}

interface Route {
  readonly id: string;
  readonly origin: Stop;
  readonly destination: Stop;
  readonly intermediateStops: ReadonlyArray<Stop>;
  readonly durationMin: number;
  readonly distanceKm: number;
  readonly busClass: 'standard' | 'vip' | 'sleeper';
  readonly status: 'active' | 'draft' | 'suspended';
  readonly frequency: string;
}

const MOCK_ROUTES: ReadonlyArray<Route> = [
  {
    id: 'r-1',
    origin: { city: 'Abidjan', country: 'CI', arrivalOffsetMin: 0 },
    destination: { city: 'Ouagadougou', country: 'BF', arrivalOffsetMin: 960 },
    intermediateStops: [
      { city: 'Yamoussoukro', country: 'CI', arrivalOffsetMin: 210 },
      { city: 'Bouaké', country: 'CI', arrivalOffsetMin: 360 },
      { city: 'Ferkessédougou', country: 'CI', arrivalOffsetMin: 540 },
    ],
    durationMin: 960,
    distanceKm: 1170,
    busClass: 'vip',
    status: 'active',
    frequency: '2 départs / jour',
  },
  {
    id: 'r-2',
    origin: { city: 'Abidjan', country: 'CI', arrivalOffsetMin: 0 },
    destination: { city: 'Yamoussoukro', country: 'CI', arrivalOffsetMin: 210 },
    intermediateStops: [],
    durationMin: 210,
    distanceKm: 240,
    busClass: 'standard',
    status: 'active',
    frequency: '5 départs / jour',
  },
  {
    id: 'r-3',
    origin: { city: 'Abidjan', country: 'CI', arrivalOffsetMin: 0 },
    destination: { city: 'Accra', country: 'GH', arrivalOffsetMin: 600 },
    intermediateStops: [{ city: 'Aboisso', country: 'CI', arrivalOffsetMin: 120 }],
    durationMin: 600,
    distanceKm: 540,
    busClass: 'vip',
    status: 'draft',
    frequency: 'Non publié',
  },
];

const STATUS_CONFIG: Record<Route['status'], { label: string; className: string }> = {
  active: {
    label: 'Actif',
    className:
      'bg-[var(--color-success)]/10 text-[var(--color-success)] ring-[var(--color-success)]/20',
  },
  draft: {
    label: 'Brouillon',
    className:
      'bg-[var(--color-warning)]/15 text-[var(--color-warning)] ring-[var(--color-warning)]/30',
  },
  suspended: {
    label: 'Suspendu',
    className: 'bg-black/5 text-[var(--color-text-muted)] ring-black/10',
  },
};

const CLASS_LABEL: Record<Route['busClass'], string> = {
  standard: 'Standard',
  vip: 'VIP',
  sleeper: 'Sleeper',
};

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

export default function OperatorRoutesPage() {
  const [routes] = useState<ReadonlyArray<Route>>(MOCK_ROUTES);
  const [showForm, setShowForm] = useState(false);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('');

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="display text-2xl font-medium tracking-tight">Lignes</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Gérez vos itinéraires, arrêts et fréquences. {routes.length} lignes enregistrées.
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle ligne
        </Button>
      </header>

      {showForm && (
        <div className="animate-fade rounded-[var(--radius-xl)] border border-[var(--color-accent-warm)]/30 bg-[var(--color-accent-warm)]/[0.04] p-5">
          <h3 className="display text-lg font-medium">Créer une ligne</h3>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Renseignez les villes et la durée. Les arrêts intermédiaires sont optionnels et peuvent
            être ajoutés après création.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Input
              label="Départ"
              placeholder="Abidjan"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            />
            <Input
              label="Arrivée"
              placeholder="Ouagadougou"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
            <Input
              label="Durée (minutes)"
              placeholder="960"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
            <Button disabled={!origin.trim() || !destination.trim() || !duration.trim()}>
              Enregistrer
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {routes.map((r, i) => {
          const statusCfg = STATUS_CONFIG[r.status];
          return (
            <article
              key={r.id}
              className="card-hover animate-entrance flex flex-col gap-4 rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-5 shadow-sm"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="default"
                      className={cn('text-[10px] font-semibold', statusCfg.className)}
                    >
                      {statusCfg.label}
                    </Badge>
                    <Badge variant="primary" className="text-[10px] font-semibold uppercase">
                      {CLASS_LABEL[r.busClass]}
                    </Badge>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {r.frequency}
                    </span>
                  </div>
                  <h3 className="display mt-2 text-xl font-medium leading-tight tracking-tight">
                    {r.origin.city}
                    <span className="mx-2 italic text-[var(--color-accent-warm-ink)]">vers</span>
                    {r.destination.city}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent-warm-ink)]/40 hover:text-[var(--color-accent-warm-ink)]"
                    aria-label="Modifier la ligne"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-error)]/40 hover:text-[var(--color-error)]"
                    aria-label="Supprimer la ligne"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Stops timeline */}
              <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-1">
                <RouteStop stop={r.origin} type="origin" />
                {r.intermediateStops.map((s) => (
                  <RouteStop key={`${r.id}-${s.city}`} stop={s} type="intermediate" />
                ))}
                <RouteStop stop={r.destination} type="destination" />
              </ol>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-black/5 pt-3 text-xs text-[var(--color-text-muted)]">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Durée : <span className="font-medium tabular-nums text-[var(--color-text)]">{formatDuration(r.durationMin)}</span>
                </span>
                <span>·</span>
                <span>
                  Distance :{' '}
                  <span className="font-medium tabular-nums text-[var(--color-text)]">
                    {r.distanceKm} km
                  </span>
                </span>
                <span>·</span>
                <span>
                  Arrêts :{' '}
                  <span className="font-medium tabular-nums text-[var(--color-text)]">
                    {r.intermediateStops.length + 2}
                  </span>
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function RouteStop({
  stop,
  type,
}: {
  readonly stop: Stop;
  readonly type: 'origin' | 'intermediate' | 'destination';
}) {
  const dot =
    type === 'origin'
      ? 'bg-[var(--color-accent-warm)]'
      : type === 'destination'
        ? 'bg-[var(--color-primary)]'
        : 'bg-black/20';
  return (
    <>
      <li className="inline-flex items-center gap-1.5">
        <span className={cn('h-2 w-2 shrink-0 rounded-full', dot)} aria-hidden="true" />
        <span className="text-sm text-[var(--color-text)]">{stop.city}</span>
        <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
          {stop.country}
        </span>
      </li>
      {type !== 'destination' && (
        <span aria-hidden="true" className="text-[var(--color-text-muted)]/50">
          ——
        </span>
      )}
    </>
  );
}
