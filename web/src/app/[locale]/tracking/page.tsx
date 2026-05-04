'use client';

import { useEffect, useState } from 'react';
import {
  MapPin,
  Clock,
  Bus,
  Phone,
  Navigation,
  CheckCircle2,
  Circle,
  RefreshCw,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/shadcn/progress';
import { Badge } from '@/components/shadcn/badge';
import { cn } from '@/lib/cn';

interface Stop {
  readonly name: string;
  readonly time: string;
  readonly status: 'passed' | 'current' | 'pending';
  readonly actual?: string;
}

interface TrackingData {
  readonly bookingRef: string;
  readonly bus: { number: string; company: string; driver: string; phone: string };
  readonly route: {
    from: string;
    to: string;
    departureTime: string;
    estimatedArrival: string;
    currentETA: string;
  };
  readonly currentLocation: {
    lastUpdate: string;
    speed: string;
    nextStop: string;
    distanceToNext: string;
  };
  readonly stops: ReadonlyArray<Stop>;
  readonly progress: number;
}

const MOCK_TRACKING: TrackingData = {
  bookingRef: 'BEX-2026-789456',
  bus: {
    number: 'BUS-045',
    company: 'Trans Africa Express',
    driver: 'Mamadou Diallo',
    phone: '+225 07 00 00 00',
  },
  route: {
    from: 'Abidjan',
    to: 'Yamoussoukro',
    departureTime: '08:00',
    estimatedArrival: '12:30',
    currentETA: '12:15',
  },
  currentLocation: {
    lastUpdate: 'Il y a 2 min',
    speed: '85 km/h',
    nextStop: 'Toumodi',
    distanceToNext: '45 km',
  },
  stops: [
    { name: 'Abidjan — Gare Routière', time: '08:00', status: 'passed', actual: '08:05' },
    { name: 'Péage de Yamoussoukro', time: '09:30', status: 'passed', actual: '09:25' },
    { name: 'Toumodi', time: '10:45', status: 'current' },
    { name: 'Yamoussoukro Centre', time: '12:30', status: 'pending' },
  ],
  progress: 65,
};

export default function TrackingPage() {
  const [bookingRef, setBookingRef] = useState('');
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  function handleSearch(): void {
    if (!bookingRef.trim()) {
      toast.error('Entrez une référence de réservation');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setTracking(MOCK_TRACKING);
      setIsLoading(false);
      setLastRefresh(new Date());
      toast.success('Bus localisé', {
        description: `Prochain arrêt : ${MOCK_TRACKING.currentLocation.nextStop}`,
      });
    }, 900);
  }

  function handleRefresh(): void {
    setLastRefresh(new Date());
    toast.info('Position actualisée', {
      description: 'Dernière position : il y a 2 min',
    });
  }

  useEffect(() => {
    if (!tracking) return;
    const id = setInterval(() => setLastRefresh(new Date()), 30_000);
    return () => clearInterval(id);
  }, [tracking]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 sm:p-6">
      <section className="grain grain-strong relative overflow-hidden rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-primary-light)] to-[oklch(25%_0.14_280)] p-10 text-white shadow-xl">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(circle at 20% 30%, oklch(82% 0.14 85 / 0.4), transparent 50%), radial-gradient(circle at 80% 80%, oklch(72% 0.17 70 / 0.3), transparent 50%)',
          }}
        />
        <div className="relative z-10 mx-auto max-w-xl text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent-gold)]">
            En route
          </p>
          <h1 className="display mt-3 text-[clamp(2rem,1rem+3vw,3.25rem)] font-medium leading-[1.05] tracking-tight">
            Suivre mon voyage
          </h1>
          <p className="mt-3 text-white/80">
            Entrez votre référence de réservation pour voir votre bus en temps réel.
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <label className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Ex : BEX-2026-789456"
                value={bookingRef}
                onChange={(e) => setBookingRef(e.target.value)}
                className="h-12 w-full rounded-[var(--radius-lg)] bg-white pl-10 pr-3 text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)]"
              />
            </label>
            <Button
              size="lg"
              onClick={handleSearch}
              disabled={!bookingRef.trim() || isLoading}
              className="bg-[var(--color-accent-gold)] text-[oklch(12%_0.02_260)] hover:bg-[var(--color-accent-warm)] hover:text-white"
            >
              {isLoading ? 'Recherche…' : 'Suivre'}
            </Button>
          </div>
        </div>
      </section>

      {!tracking && !isLoading && (
        <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-8 shadow-sm">
            <span className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent-warm-ink)]">
              En un coup d&apos;œil
            </span>
            <h2 className="display mt-3 text-[clamp(1.5rem,1rem+1.5vw,2rem)] font-medium leading-[1.1] tracking-tight">
              Ce que vous verrez en temps réel.
            </h2>
            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              <InfoItem
                number="01"
                title="Position GPS"
                text="La localisation du bus, actualisée toutes les 30 secondes."
              />
              <InfoItem
                number="02"
                title="ETA dynamique"
                text="L&apos;heure d&apos;arrivée ajustée selon le trafic et les arrêts."
              />
              <InfoItem
                number="03"
                title="Prochain arrêt"
                text="Le prochain arrêt du bus et la distance restante."
              />
              <InfoItem
                number="04"
                title="Contact direct"
                text="Numéro du chauffeur en cas d&apos;urgence ou de retard."
              />
            </dl>
          </div>
          <aside className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-bg)] p-6 shadow-sm">
            <Clock className="h-5 w-5 text-[var(--color-accent-warm-ink)]" />
            <p className="text-sm font-medium">
              La référence se trouve dans votre email de confirmation.
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">
              Format : <code className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-xs">BEX-AAAA-XXXXXX</code>.
              Le suivi est actif 2 heures avant le départ.
            </p>
          </aside>
        </section>
      )}

      {tracking && (
        <>
          <section className="animate-entrance rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                  Référence {tracking.bookingRef}
                </p>
                <h2 className="mt-1 text-2xl font-bold">
                  {tracking.route.from} <span className="text-[var(--color-accent-warm-ink)]">→</span>{' '}
                  {tracking.route.to}
                </h2>
              </div>
              <Badge
                variant="outline"
                className="gap-2 border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-3 py-1.5 text-sm font-medium text-[var(--color-success)]"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-success)] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-success)]" />
                </span>
                En route
              </Badge>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-sm text-[var(--color-text-muted)]">
                <span className="tabular-nums">{tracking.route.departureTime}</span>
                <span className="tabular-nums">ETA : {tracking.route.currentETA}</span>
              </div>
              <Progress value={tracking.progress} className="mt-2 h-2 bg-black/5" />
              <p className="mt-2 text-xs text-[var(--color-text-muted)] tabular-nums">
                {tracking.progress}% du trajet effectué
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoCard
                icon={<Navigation className="h-5 w-5" />}
                label="Prochain arrêt"
                primary={tracking.currentLocation.nextStop}
                secondary={`À ${tracking.currentLocation.distanceToNext}`}
              />
              <InfoCard
                icon={<Clock className="h-5 w-5" />}
                label="Dernière mise à jour"
                primary={tracking.currentLocation.lastUpdate}
                secondary={`Vitesse : ${tracking.currentLocation.speed}`}
              />
            </div>
          </section>

          <section className="rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Arrêts du trajet</h3>
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent-warm)]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Actualisé à {lastRefresh.toLocaleTimeString('fr-FR')}
              </button>
            </div>
            <ol className="flex flex-col">
              {tracking.stops.map((stop, i) => (
                <li key={stop.name} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    {stop.status === 'passed' ? (
                      <CheckCircle2 className="h-6 w-6 text-[var(--color-success)]" />
                    ) : stop.status === 'current' ? (
                      <div className="relative flex h-6 w-6 items-center justify-center">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent-warm)] opacity-60" />
                        <span className="relative h-3 w-3 rounded-full bg-[var(--color-accent-warm)]" />
                      </div>
                    ) : (
                      <Circle className="h-6 w-6 text-[var(--color-text-muted)]/40" />
                    )}
                    {i < tracking.stops.length - 1 && (
                      <span
                        className={cn(
                          'my-1 flex-1 w-0.5',
                          stop.status === 'passed'
                            ? 'bg-[var(--color-success)]'
                            : 'bg-black/10',
                        )}
                      />
                    )}
                  </div>
                  <div className="flex flex-1 items-baseline justify-between gap-3 pb-6">
                    <div>
                      <p
                        className={cn(
                          'font-medium',
                          stop.status === 'pending' && 'text-[var(--color-text-muted)]',
                        )}
                      >
                        {stop.name}
                      </p>
                      {stop.actual && stop.actual !== stop.time && (
                        <p className="text-xs text-[var(--color-text-muted)]">
                          Prévu {stop.time} · Réel {stop.actual}
                        </p>
                      )}
                    </div>
                    <span className="font-mono text-sm tabular-nums">{stop.time}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-6 shadow-sm">
            <h3 className="mb-4 font-semibold">Informations du bus</h3>
            <dl className="grid gap-3 sm:grid-cols-2">
              <InfoRow icon={<Bus className="h-4 w-4" />} label="Numéro" value={tracking.bus.number} />
              <InfoRow icon={<MapPin className="h-4 w-4" />} label="Compagnie" value={tracking.bus.company} />
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Chauffeur" value={tracking.bus.driver} />
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Contact" value={tracking.bus.phone} />
            </dl>
          </section>
        </>
      )}
    </main>
  );
}

function InfoCard({
  icon,
  label,
  primary,
  secondary,
}: {
  icon: React.ReactNode;
  label: string;
  primary: string;
  secondary: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-black/5 bg-[var(--color-bg)] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-warm)]/15 text-[var(--color-accent-warm-ink)]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
        <p className="truncate font-semibold">{primary}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{secondary}</p>
      </div>
    </div>
  );
}

function InfoItem({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="display shrink-0 text-2xl font-medium tabular-nums text-[var(--color-accent-warm)]/40">
        {number}
      </span>
      <div>
        <dt className="font-semibold">{title}</dt>
        <dd className="mt-1 text-sm text-[var(--color-text-muted)]">{text}</dd>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-bg)] px-3 py-2">
      <span className="text-[var(--color-text-muted)]">{icon}</span>
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-[var(--color-text-muted)]">{label}</dt>
        <dd className="truncate font-medium">{value}</dd>
      </div>
    </div>
  );
}
